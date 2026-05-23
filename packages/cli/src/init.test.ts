import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, afterEach, vi } from "vitest";
import { initCommand } from "./commands/init.js";

describe("initCommand", () => {
  const dirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      dirs.map((d) => rm(d, { recursive: true, force: true }).catch(() => {})),
    );
    dirs.length = 0;
  });

  it("scaffolds a complete course directory", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-init-"));
    const projectName = "test-course";
    const targetDir = join(parent, projectName);
    dirs.push(parent);

    await initCommand(projectName, { dir: targetDir });

    expect(existsSync(join(targetDir, "course.yaml"))).toBe(true);
    expect(existsSync(join(targetDir, "lxpack.config.json"))).toBe(true);
    expect(existsSync(join(targetDir, "lessons", "welcome.md"))).toBe(true);
    expect(
      existsSync(join(targetDir, "interactions", "phishing-lab", "index.html")),
    ).toBe(true);
    expect(existsSync(join(targetDir, "assessments", "final.yaml"))).toBe(true);
  });

  it("uses project name as directory when dir option is omitted", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-init-default-"));
    dirs.push(parent);
    const cwd = process.cwd();
    process.chdir(parent);

    try {
      await initCommand("my-lx-course");
      expect(existsSync(join(parent, "my-lx-course", "course.yaml"))).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });

  it("refuses to overwrite an existing course without --force", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-init-force-"));
    dirs.push(parent);
    const targetDir = join(parent, "existing");
    await initCommand("existing", { dir: targetDir });

    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(initCommand("existing", { dir: targetDir })).rejects.toThrow(
      "exit:1",
    );
    exit.mockRestore();
  });
});
