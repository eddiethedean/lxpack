import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import { collectFiles } from "./package.js";

describe("collectFiles", () => {
  it("skips dotfiles, node_modules, and build metadata", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-collect-"));
    await writeFile(join(dir, "course.yaml"), "ignored");
    await writeFile(join(dir, "keep.txt"), "ok");
    await mkdir(join(dir, ".hidden"), { recursive: true });
    await writeFile(join(dir, ".hidden", "secret.txt"), "no");
    await mkdir(join(dir, "node_modules"), { recursive: true });
    await writeFile(join(dir, "node_modules", "pkg.js"), "no");
    await mkdir(join(dir, ".lxpack"), { recursive: true });
    await writeFile(join(dir, ".lxpack", "out.zip"), "no");

    await mkdir(join(dir, "nested"), { recursive: true });
    await writeFile(join(dir, "nested", "a.txt"), "a");
    await writeFile(join(dir, "nested", "b.txt"), "b");

    const files = await collectFiles(dir, dir);
    expect(files.map((f) => f.path).sort()).toEqual([
      "keep.txt",
      "nested/a.txt",
      "nested/b.txt",
    ]);
  });
});
