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
    const components = join(REPO_ROOT, "packages/components/dist/bundle.js");
    if (!existsSync(components)) {
      execSync("pnpm --filter @lxpack/components build", {
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

  it("uses defaultTarget from lxpack.config.json when --target is omitted", async () => {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(
      join(workDir, "course", "lxpack.config.json"),
      JSON.stringify({ exports: { defaultTarget: "standalone" } }),
    );
    await buildCommand({});
    expect(
      existsSync(
        resolve(workDir, "course", ".lxpack", "minimal-valid-course-standalone.zip"),
      ),
    ).toBe(true);
  });

  it("falls back to scorm12 when config and target are omitted", async () => {
    const { rm } = await import("node:fs/promises");
    await rm(join(workDir, "course", "lxpack.config.json"));
    await buildCommand({});
    expect(
      existsSync(
        resolve(workDir, "course", ".lxpack", "minimal-valid-course-scorm12.zip"),
      ),
    ).toBe(true);
  });

  it("uses a fallback slug when the title has no alphanumeric characters", async () => {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(
      join(workDir, "course", "course.yaml"),
      "title: '!!!'\nversion: 1.0.0\nlessons:\n  - id: intro\n    type: markdown\n    file: lessons/intro.md\n",
    );
    await buildCommand({ target: "scorm12" });
    const { readdir } = await import("node:fs/promises");
    const outputs = await readdir(resolve(workDir, "course", ".lxpack"));
    expect(outputs.some((f) => /^course-[a-z0-9]+-scorm12\.zip$/.test(f))).toBe(
      true,
    );
  });

  it("writes zip to a custom output path inside the course directory", async () => {
    const customZip = join(process.cwd(), "custom-export.zip");
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

  it("builds SCORM 2004 multi-SCO zip", async () => {
    const { cp } = await import("node:fs/promises");
    const branchDir = join(workDir, "branching");
    await cp(fixturePath("branching-demo"), branchDir, { recursive: true });
    process.chdir(branchDir);

    await buildCommand({ target: "scorm2004" });

    const zipPath = join(branchDir, ".lxpack", "branching-demo-scorm2004.zip");
    expect(existsSync(zipPath)).toBe(true);

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("sco/intro/index.html")).toBeTruthy();
    const ims = await zip.file("imsmanifest.xml")?.async("string");
    expect(ims).toContain("2004 4th Edition");
    process.chdir(join(workDir, "course"));
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
    const outDir = join(process.cwd(), "out-scorm");
    cleanup.push(outDir);
    await buildCommand({ target: "scorm12", dir: true, output: outDir });

    expect(existsSync(join(outDir, "index.html"))).toBe(true);
    expect(existsSync(join(outDir, "imsmanifest.xml"))).toBe(true);
  });

  it("writes unpacked SCORM 2004 multi-SCO tree with --dir", async () => {
    const { cp } = await import("node:fs/promises");
    const branchDir = join(workDir, "branching-dir");
    await cp(fixturePath("branching-demo"), branchDir, { recursive: true });
    const outDir = join(branchDir, "out-scorm2004");
    cleanup.push(outDir);
    process.chdir(branchDir);

    await buildCommand({ target: "scorm2004", dir: true, output: outDir });

    expect(existsSync(join(outDir, "imsmanifest.xml"))).toBe(true);
    expect(existsSync(join(outDir, "sco/intro/index.html"))).toBe(true);
    expect(existsSync(join(outDir, "lxpack-runtime.js"))).toBe(true);
    process.chdir(join(workDir, "course"));
  });

  it("exits with code 1 for invalid target", async () => {
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(buildCommand({ target: "not-a-target" as "scorm12" })).rejects.toThrow(
      "exit:1",
    );
    exit.mockRestore();
  });

  it("builds xapi zip when tracking.xapi.activityIri is set", async () => {
    const { cp } = await import("node:fs/promises");
    const xapiDir = join(workDir, "xapi-course");
    await cp(fixturePath("xapi-valid"), xapiDir, { recursive: true });
    process.chdir(xapiDir);

    await buildCommand({ target: "xapi" });

    const zipPath = join(xapiDir, ".lxpack", "xapi-valid-course-xapi.zip");
    expect(existsSync(zipPath)).toBe(true);

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("tincan.xml")).toBeTruthy();
    expect(zip.file("index.html")).toBeTruthy();
    process.chdir(join(workDir, "course"));
  });

  it("builds cmi5 zip when tracking.xapi.activityIri is set", async () => {
    const { cp } = await import("node:fs/promises");
    const cmi5Dir = join(workDir, "cmi5-course");
    await cp(fixturePath("xapi-valid"), cmi5Dir, { recursive: true });
    process.chdir(cmi5Dir);

    await buildCommand({ target: "cmi5" });

    const zipPath = join(cmi5Dir, ".lxpack", "xapi-valid-course-cmi5.zip");
    expect(existsSync(zipPath)).toBe(true);

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("cmi5.xml")).toBeTruthy();
    expect(zip.file("index.html")).toBeTruthy();
    process.chdir(join(workDir, "course"));
  });

  it("exits when xapi build lacks activityIri", async () => {
    const { cp } = await import("node:fs/promises");
    const badDir = join(workDir, "missing-iri");
    await cp(fixturePath("missing-xapi-iri"), badDir, { recursive: true });
    process.chdir(badDir);

    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(buildCommand({ target: "xapi" })).rejects.toThrow("exit:1");
    exit.mockRestore();
    process.chdir(join(workDir, "course"));
  });

  it("exits when lxpack.config.json is invalid", async () => {
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(
      join(process.cwd(), "lxpack.config.json"),
      "{ not valid json",
    );
    await expect(buildCommand({ target: "scorm12" })).rejects.toThrow("exit:1");
    exit.mockRestore();
    await rm(join(process.cwd(), "lxpack.config.json"), { force: true });
  });

  it("exits when packaging hits a symlink in the course tree", async () => {
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });
    const outside = await mkdtemp(join(tmpdir(), "lxpack-build-sym-out-"));
    cleanup.push(outside);
    const { symlink, writeFile, mkdir } = await import("node:fs/promises");
    await writeFile(join(outside, "secret.txt"), "x");
    await mkdir(join(process.cwd(), "assets"), { recursive: true });
    await symlink(join(outside, "secret.txt"), join(process.cwd(), "assets", "leak.txt"));

    await expect(buildCommand({ target: "scorm12" })).rejects.toThrow("exit:1");
    exit.mockRestore();
    await rm(join(process.cwd(), "assets"), { recursive: true, force: true });
  });

  it("rethrows unexpected packaging errors", async () => {
    const api = await import("@lxpack/api");
    vi.spyOn(api, "buildCourse").mockRejectedValueOnce(
      new Error("packager boom"),
    );
    await expect(buildCommand({ target: "scorm12" })).rejects.toThrow(
      "packager boom",
    );
    vi.restoreAllMocks();
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
