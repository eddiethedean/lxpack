import { existsSync, symlinkSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  materializeLessonkitProject,
  parseInterchangeInput,
  resolvePackageAssessments,
} from "./materialize-lessonkit.js";
import type { LessonkitInterchangeV1 } from "./lessonkit-interchange.js";

const interchange: LessonkitInterchangeV1 = {
  format: "lessonkit",
  version: "1",
  course: { title: "Materialized" },
  lessons: [{ id: "spa1", type: "spa", path: "dist/spa1", title: "SPA" }],
};

describe("materializeLessonkitProject", () => {
  it("writes course.yaml and copies SPA directories", async () => {
    const spaSource = await mkdtemp(join(tmpdir(), "lxpack-spa-src-"));
    await writeFile(
      join(spaSource, "index.html"),
      "<!doctype html><html><body>ok</body></html>",
    );

    const result = await materializeLessonkitProject({
      interchange,
      spaDirs: { spa1: spaSource },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(existsSync(join(result.courseDir, "course.yaml"))).toBe(true);
    expect(existsSync(join(result.courseDir, "dist/spa1/index.html"))).toBe(
      true,
    );

    const yaml = await readFile(join(result.courseDir, "course.yaml"), "utf-8");
    expect(yaml).toContain("Materialized");

    await rm(result.courseDir, { recursive: true, force: true });
    await rm(spaSource, { recursive: true, force: true });
  });

  it("writes authoring files when writeAuthoringFiles is true", async () => {
    const spaSource = await mkdtemp(join(tmpdir(), "lxpack-spa-wa-"));
    await writeFile(join(spaSource, "index.html"), "<html></html>");

    const ix: LessonkitInterchangeV1 = {
      ...interchange,
      assessments: [
        {
          id: "quiz",
          title: "Quiz",
          passingScore: 0.7,
          questions: [
            {
              id: "q1",
              prompt: "One?",
              choices: [
                { id: "a", text: "A", correct: true },
                { id: "b", text: "B" },
              ],
            },
          ],
        },
      ],
    };

    const result = await materializeLessonkitProject({
      interchange: ix,
      spaDirs: { spa1: spaSource },
      writeAuthoringFiles: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(existsSync(join(result.courseDir, "lessonkit.json"))).toBe(true);
    expect(existsSync(join(result.courseDir, "assessments/quiz.yaml"))).toBe(
      true,
    );

    await rm(result.courseDir, { recursive: true, force: true });
    await rm(spaSource, { recursive: true, force: true });
  });

  it("uses provided courseDir", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-course-"));
    const spaSource = await mkdtemp(join(tmpdir(), "lxpack-spa-cd-"));
    await writeFile(join(spaSource, "index.html"), "<html></html>");

    const result = await materializeLessonkitProject({
      interchange,
      spaDirs: { spa1: spaSource },
      courseDir,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.courseDir).toBe(courseDir);
    }

    await rm(courseDir, { recursive: true, force: true });
    await rm(spaSource, { recursive: true, force: true });
  });

  it("reports missing spaDirs entry", async () => {
    const result = await materializeLessonkitProject({
      interchange,
      spaDirs: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "spaDirs.spa1")).toBe(true);
    }
  });

  it("reports missing SPA source directory", async () => {
    const result = await materializeLessonkitProject({
      interchange,
      spaDirs: { spa1: join(tmpdir(), "does-not-exist-spa-12345") },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.message).toContain("not found");
    }
  });

  it("reports SPA source without index.html", async () => {
    const spaSource = await mkdtemp(join(tmpdir(), "lxpack-spa-noix-"));
    const result = await materializeLessonkitProject({
      interchange,
      spaDirs: { spa1: spaSource },
    });

    expect(result.ok).toBe(false);
    await rm(spaSource, { recursive: true, force: true });
  });

  it("rejects SPA dest path outside course root", async () => {
    const spaSource = await mkdtemp(join(tmpdir(), "lxpack-spa-bad-"));
    await writeFile(join(spaSource, "index.html"), "<html></html>");

    const result = await materializeLessonkitProject({
      interchange: {
        ...interchange,
        lessons: [{ id: "spa1", type: "spa", path: "../../../escape" }],
      },
      spaDirs: { spa1: spaSource },
    });

    expect(result.ok).toBe(false);

    await rm(spaSource, { recursive: true, force: true });
    if (result.ok) {
      await rm(result.courseDir, { recursive: true, force: true });
    }
  });

  it("rejects symlink inside SPA payload", async () => {
    const spaSource = await mkdtemp(join(tmpdir(), "lxpack-spa-sym-"));
    const outside = await mkdtemp(join(tmpdir(), "lxpack-out-"));
    await writeFile(join(outside, "secret.html"), "<html></html>");
    await writeFile(join(spaSource, "index.html"), "<html></html>");
    symlinkSync(join(outside, "secret.html"), join(spaSource, "link.html"));

    const result = await materializeLessonkitProject({
      interchange,
      spaDirs: { spa1: spaSource },
    });

    expect(result.ok).toBe(false);
    await rm(spaSource, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });

  it("keeps courseDir on failure when debug is true", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-debug-"));
    const result = await materializeLessonkitProject({
      interchange,
      spaDirs: {},
      courseDir,
      debug: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.courseDir).toBe(courseDir);
    }
    await rm(courseDir, { recursive: true, force: true });
  });
});

describe("resolvePackageAssessments", () => {
  it("prefers injected assessments", () => {
    const injected = [{ id: "a" }];
    expect(
      resolvePackageAssessments(interchange, injected),
    ).toBe(injected);
  });

  it("returns interchange assessments when no injection", () => {
    const ix: LessonkitInterchangeV1 = {
      ...interchange,
      assessments: [
        {
          id: "quiz",
          passingScore: 0.7,
          questions: [
            {
              id: "q1",
              prompt: "Q",
              choices: [
                { id: "a", text: "A", correct: true },
                { id: "b", text: "B" },
              ],
            },
          ],
        },
      ],
    };
    expect(resolvePackageAssessments(ix)?.length).toBe(1);
  });
});

describe("parseInterchangeInput", () => {
  it("delegates to parseLessonkitInterchange", () => {
    const result = parseInterchangeInput(interchange);
    expect(result.ok).toBe(true);
  });
});
