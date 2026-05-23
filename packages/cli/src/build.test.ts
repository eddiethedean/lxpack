import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import JSZip from "jszip";
import { execSync } from "node:child_process";
import { fixturePath, REPO_ROOT } from "../../../test/helpers/paths.js";
import { buildCommand } from "./commands/build.js";

describe("buildCommand", () => {
  const originalCwd = process.cwd();
  let workDir: string;
  const cleanup: string[] = [];

  beforeAll(() => {
    const client = join(REPO_ROOT, "packages/runtime/dist/client.js");
    if (!existsSync(client)) {
      execSync("pnpm --filter @lxpack/runtime build", {
        cwd: REPO_ROOT,
        stdio: "pipe",
      });
    }
  });

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), "lxpack-build-"));
    const { cp } = await import("node:fs/promises");
    await cp(fixturePath("minimal-valid"), join(workDir, "course"), {
      recursive: true,
    });
    process.chdir(join(workDir, "course"));
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    await Promise.all(
      cleanup.map((d) => rm(d, { recursive: true, force: true }).catch(() => {})),
    );
    cleanup.length = 0;
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("defaults to scorm12 target when omitted", async () => {
    await buildCommand({});
    const zipPath = resolve(
      workDir,
      "course",
      ".lxpack",
      "minimal-valid-course-scorm12.zip",
    );
    expect(existsSync(zipPath)).toBe(true);
  });

  it("writes zip to a custom output path", async () => {
    const customZip = join(workDir, "custom-export.zip");
    await buildCommand({ target: "scorm12", output: customZip });
    expect(existsSync(customZip)).toBe(true);
  });

  it("builds SCORM 1.2 zip in .lxpack by default", async () => {
    await buildCommand({ target: "scorm12" });

    const zipPath = resolve(
      workDir,
      "course",
      ".lxpack",
      "minimal-valid-course-scorm12.zip",
    );
    expect(existsSync(zipPath)).toBe(true);

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("imsmanifest.xml")).toBeTruthy();
    expect(zip.file("index.html")).toBeTruthy();
  });

  it("builds standalone zip when requested", async () => {
    await buildCommand({ target: "standalone" });

    const zipPath = resolve(
      workDir,
      "course",
      ".lxpack",
      "minimal-valid-course-standalone.zip",
    );
    expect(existsSync(zipPath)).toBe(true);

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("imsmanifest.xml")).toBeNull();
  });

  it("uses default output directory for dir builds without --output", async () => {
    await buildCommand({ target: "standalone", dir: true });
    expect(
      existsSync(join(workDir, "course", ".lxpack", "standalone")),
    ).toBe(true);
  });

  it("writes unpacked output with --dir", async () => {
    const outDir = join(workDir, "out-scorm");
    cleanup.push(outDir);
    await buildCommand({ target: "scorm12", dir: true, output: outDir });

    expect(existsSync(join(outDir, "index.html"))).toBe(true);
    expect(existsSync(join(outDir, "imsmanifest.xml"))).toBe(true);
  });

  it("exits with code 1 for invalid target", async () => {
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(buildCommand({ target: "xapi" })).rejects.toThrow("exit:1");
    exit.mockRestore();
  });

  it("exits when course fails validation", async () => {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(
      join(workDir, "course", "course.yaml"),
      "title: Broken\nversion: 1.0.0\nlessons:\n  - id: intro\n    type: markdown\n    file: lessons/missing.md\n",
    );

    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(buildCommand({ target: "scorm12" })).rejects.toThrow("exit:1");
    exit.mockRestore();
  });
});
