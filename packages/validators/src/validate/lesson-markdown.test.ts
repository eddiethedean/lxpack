import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { validateMarkdownLesson } from "./lesson-markdown.js";

describe("validateMarkdownLesson", () => {
  it("warns on unsafe URI schemes blocked at runtime", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-md-uri-"));
    await mkdir(join(courseDir, "lessons"), { recursive: true });
    await writeFile(
      join(courseDir, "lessons", "unsafe.md"),
      "[click](vbscript:alert(1))",
    );

    const issues = validateMarkdownLesson(courseDir, {
      id: "unsafe",
      type: "markdown",
      file: "lessons/unsafe.md",
    });

    expect(
      issues.some(
        (i) => i.severity === "warning" && i.message.includes("vbscript:"),
      ),
    ).toBe(true);
  });
});
