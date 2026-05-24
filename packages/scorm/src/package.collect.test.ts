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

  it("skips assessments directory files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-collect-assess-"));
    await mkdir(join(dir, "assessments"), { recursive: true });
    await writeFile(
      join(dir, "assessments", "quiz.yaml"),
      "id: quiz\nquestions: []\n",
    );
    await mkdir(join(dir, "lessons"), { recursive: true });
    await writeFile(join(dir, "lessons", "intro.md"), "# Hi");

    const files = await collectFiles(dir, dir);
    expect(files.map((f) => f.path)).toEqual(["lessons/intro.md"]);
  });

  it("skips course root index.html and lxpack config files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-collect-skip-"));
    await writeFile(join(dir, "index.html"), "<html></html>");
    await writeFile(join(dir, "lxpack.config.json"), "{}");
    await writeFile(join(dir, "lxpack.config.ts"), "export default {}");
    await writeFile(join(dir, "content.txt"), "ok");

    const files = await collectFiles(dir, dir);
    expect(files.map((f) => f.path)).toEqual(["content.txt"]);
  });
});
