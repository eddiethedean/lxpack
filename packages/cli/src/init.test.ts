import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, afterEach, vi } from "vitest";
import { initCommand } from "./commands/init.js";

describe("initCommand", () => {
  const dirs: string[] = [];
  const originalCwd = process.cwd();

  afterEach(async () => {
    process.chdir(originalCwd);
    await Promise.all(
      dirs.map((d) => rm(d, { recursive: true, force: true }).catch(() => {})),
    );
    dirs.length = 0;
  });

  it("scaffolds a complete course directory", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-init-"));
    dirs.push(parent);
    process.chdir(parent);

    await initCommand("test-course", { dir: "test-course" });

    const targetDir = join(parent, "test-course");
    expect(existsSync(join(targetDir, "course.yaml"))).toBe(true);
    expect(existsSync(join(targetDir, "lxpack.config.json"))).toBe(true);
    expect(existsSync(join(targetDir, "lessons", "welcome.md"))).toBe(true);
    expect(
      existsSync(join(targetDir, "interactions", "phishing-lab", "index.html")),
    ).toBe(true);
    expect(existsSync(join(targetDir, "assessments", "final.yaml"))).toBe(true);
    expect(existsSync(join(targetDir, ".gitignore"))).toBe(true);
  });

  it("rejects directory paths that escape cwd", async () => {
    await expect(
      initCommand("escape", { dir: "../outside-lxpack-init" }),
    ).rejects.toThrow("inside the current working directory");
  });

  it("uses project name as directory when dir option is omitted", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-init-default-"));
    dirs.push(parent);
    process.chdir(parent);

    await initCommand("my-lx-course");
    expect(existsSync(join(parent, "my-lx-course", "course.yaml"))).toBe(true);
  });

  it("refuses to overwrite an existing course without --force", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-init-force-"));
    dirs.push(parent);
    process.chdir(parent);

    await initCommand("existing", { dir: "existing" });

    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(initCommand("existing", { dir: "existing" })).rejects.toThrow(
      "exit:1",
    );
    exit.mockRestore();
  });
});
