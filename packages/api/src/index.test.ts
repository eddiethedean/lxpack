import { describe, expect, it } from "vitest";
import { fixturePath } from "../../../test/helpers/paths.js";
import { validateCourse, buildCourse } from "./index.js";

describe("@lxpack/api", () => {
  it("validates a known-good fixture course", async () => {
    const result = await validateCourse({
      courseDir: fixturePath("minimal-valid"),
      target: "standalone",
    });
    expect(result.ok).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(result.manifest.title).toContain("Minimal");
  });

  it("builds a standalone directory for a temp course copy", async () => {
    const { mkdtemp, cp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");

    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-api-build-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });

    const result = await buildCourse({
      courseDir,
      target: "standalone",
      dir: true,
      output: "out",
      outputBaseDir: ".lxpack",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.outputDir).toContain("out");
      expect(result.fileCount).toBeGreaterThan(0);
    }

    await rm(courseDir, { recursive: true, force: true });
  });

  it("merges lessonkit.json spa lessons into the manifest", async () => {
    const { mkdtemp, cp, rm, writeFile, mkdir } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");

    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-api-ix-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });

    await mkdir(join(courseDir, "dist", "lessons", "ix-spa"), { recursive: true });
    await writeFile(
      join(courseDir, "dist", "lessons", "ix-spa", "index.html"),
      "<!doctype html><div id='root'>ix</div>",
    );

    await writeFile(
      join(courseDir, "lessonkit.json"),
      JSON.stringify({
        format: "lessonkit",
        version: "1",
        lessons: [{ id: "ix_spa", title: "IX SPA", type: "spa", path: "dist/lessons/ix-spa" }],
      }),
    );

    // Also append the lesson id into the course.yaml so the interchange acts as an augmentation.
    await writeFile(
      join(courseDir, "course.yaml"),
      `title: Minimal Valid Course\nversion: 1.0.0\nlessons:\n  - id: intro\n    type: markdown\n    file: lessons/intro.md\n  - id: lab\n    type: html\n    path: interactions/lab\n  - id: ix_spa\n    type: spa\n    path: dist/lessons/ix-spa\n\nassessments:\n  - id: quiz\n    file: assessments/quiz.yaml\n`,
    );

    const result = await validateCourse({ courseDir, target: "standalone" });
    expect(result.ok).toBe(true);
    expect(result.manifest.lessons.some((l) => l.type === "spa")).toBe(true);

    await rm(courseDir, { recursive: true, force: true });
  });
});

