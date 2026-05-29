import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

  it("clears assessments and interactions when --force is used", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-init-force-clear-"));
    dirs.push(parent);
    process.chdir(parent);

    await initCommand("existing", { dir: "existing" });
    const targetDir = join(parent, "existing");
    await writeFile(join(targetDir, "assessments", "stale.yaml"), "id: stale\n");
    await mkdir(join(targetDir, "interactions", "old-lab"), { recursive: true });
    await writeFile(
      join(targetDir, "interactions", "old-lab", "index.html"),
      "<html></html>",
    );

    await initCommand("existing", { dir: "existing", force: true });

    expect(existsSync(join(targetDir, "assessments", "stale.yaml"))).toBe(false);
    expect(existsSync(join(targetDir, "interactions", "old-lab"))).toBe(false);
    expect(existsSync(join(targetDir, "assessments", "final.yaml"))).toBe(true);
  });

  it("removes stale root files and .lxpack when --force is used", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-init-force-root-"));
    dirs.push(parent);
    process.chdir(parent);

    await initCommand("existing", { dir: "existing" });
    const targetDir = join(parent, "existing");
    await writeFile(join(targetDir, "course.yaml"), "title: Stale\nversion: 1.0.0\n");
    await mkdir(join(targetDir, ".lxpack"), { recursive: true });
    await writeFile(join(targetDir, ".lxpack", "old.zip"), "zip");

    await initCommand("existing", { dir: "existing", force: true });

    const yaml = await import("node:fs/promises").then((fs) =>
      fs.readFile(join(targetDir, "course.yaml"), "utf-8"),
    );
    expect(yaml).toContain("Existing");
    expect(yaml).not.toContain("Stale");
    expect(existsSync(join(targetDir, ".lxpack", "old.zip"))).toBe(false);
  });
});
