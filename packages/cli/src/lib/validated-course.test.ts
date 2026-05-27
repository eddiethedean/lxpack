import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fixturePath } from "../../../../test/helpers/paths.js";
import {
  loadValidatedCourseContext,
  printValidationIssues,
} from "./validated-course.js";

describe("printValidationIssues", () => {
  it("prints warnings and errors with distinct labels", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    printValidationIssues({
      valid: false,
      issues: [
        {
          path: "flow",
          message: "cycle detected",
          severity: "error",
        },
        {
          path: "interactions/lab",
          message: "use window.parent.lxpack",
          severity: "warning",
        },
      ],
    });

    expect(error.mock.calls.some((c) => String(c[0]).includes("[error]"))).toBe(
      true,
    );
    expect(warn.mock.calls.some((c) => String(c[0]).includes("[warning]"))).toBe(
      true,
    );
  });
});

describe("loadValidatedCourseContext", () => {
  it("merges lessonkit.json spa lessons before validation", async () => {
    const { cp, rm } = await import("node:fs/promises");
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-cli-ix-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });

    await mkdir(join(courseDir, "dist", "lessons", "ix-spa"), {
      recursive: true,
    });
    await writeFile(
      join(courseDir, "dist", "lessons", "ix-spa", "index.html"),
      "<!doctype html><html><body>spa</body></html>",
    );
    await writeFile(
      join(courseDir, "lessonkit.json"),
      JSON.stringify({
        format: "lessonkit",
        lessons: [
          {
            id: "ix_spa",
            title: "IX SPA",
            type: "spa",
            path: "dist/lessons/ix-spa",
          },
        ],
      }),
    );
    await writeFile(
      join(courseDir, "course.yaml"),
      `title: Minimal Valid Course
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md
  - id: lab
    type: html
    path: interactions/lab
  - id: ix_spa
    type: spa
    path: dist/lessons/ix-spa
assessments:
  - id: quiz
    file: assessments/quiz.yaml
`,
    );

    const ctx = await loadValidatedCourseContext(courseDir);
    expect(ctx).not.toBeNull();
    expect(ctx!.manifest.lessons.some((l) => l.type === "spa")).toBe(true);

    await rm(courseDir, { recursive: true, force: true });
  });
});
