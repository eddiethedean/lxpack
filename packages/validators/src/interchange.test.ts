import { mkdirSync } from "node:fs";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CourseManifest } from "./schemas.js";
import {
  loadLessonKitInterchange,
  mergeInterchangeIntoManifest,
  validateCourseWithInterchange,
} from "./interchange.js";
import { fixturePath } from "../../../test/helpers/paths.js";

const baseManifest: CourseManifest = {
  title: "Test",
  version: "1.0.0",
  lessons: [
    { id: "intro", type: "markdown", file: "lessons/intro.md" },
    { id: "spa_old", type: "spa", path: "old/path" },
  ],
};

function lessonkitJson(
  body: Record<string, unknown>,
): string {
  return JSON.stringify({
    format: "lessonkit",
    version: "1",
    lessons: [{ id: "default_spa", type: "spa", path: "dist/default" }],
    ...body,
  });
}

describe("interchange", () => {
  it("returns missing when no interchange file exists", async () => {
    const result = await loadLessonKitInterchange(fixturePath("minimal-valid"));
    expect(result.status).toBe("missing");
  });

  it("returns error for malformed lessonkit.json", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-bad-"));
    await writeFile(join(courseDir, "lessonkit.json"), "{ not json");

    const result = await loadLessonKitInterchange(courseDir);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.fileName).toBe("lessonkit.json");
      expect(result.issues[0]?.message).toContain("Invalid JSON");
    }

    const validation = await validateCourseWithInterchange(courseDir);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some((i) => i.path === "lessonkit.json")).toBe(
      true,
    );

    await rm(courseDir, { recursive: true, force: true });
  });

  it("loads lxpack.import.json when lessonkit.json is absent", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-import-"));
    await writeFile(
      join(courseDir, "lxpack.import.json"),
      lessonkitJson({
        lessons: [{ id: "ix", type: "spa", path: "dist/x" }],
      }),
    );

    const result = await loadLessonKitInterchange(courseDir);
    expect(result.status).toBe("loaded");
    if (result.status === "loaded") {
      expect(result.fileName).toBe("lxpack.import.json");
    }

    await rm(courseDir, { recursive: true, force: true });
  });

  it("mergeInterchangeIntoManifest updates course title from interchange", () => {
    const merged = mergeInterchangeIntoManifest(
      { ...baseManifest, title: "YAML Title" },
      {
        format: "lessonkit",
        version: "1",
        course: { title: "Interchange Title" },
        lessons: [{ id: "spa_old", type: "spa", path: "dist/x" }],
      },
    );
    expect(merged.title).toBe("Interchange Title");
  });

  it("mergeInterchangeIntoManifest updates tracking, lessons, and paths", () => {
    const merged = mergeInterchangeIntoManifest(baseManifest, {
      format: "lessonkit",
      version: "1",
      tracking: { completion: { threshold: 0.75 } },
      lessons: [
        { id: "spa_old", type: "spa", path: "new/path", title: "Updated" },
        {
          id: "spa_new",
          type: "spa",
          build: { outputDir: "dist/spa-new" },
          title: "New SPA",
        },
      ],
    });

    expect(merged.tracking?.completion?.threshold).toBe(0.75);
    const old = merged.lessons.find((l) => l.id === "spa_old");
    expect(old?.type).toBe("spa");
    if (old?.type === "spa") {
      expect(old.path).toBe("new/path");
      expect(old.title).toBe("Updated");
    }
    const added = merged.lessons.find((l) => l.id === "spa_new");
    expect(added?.type).toBe("spa");
    if (added?.type === "spa") {
      expect(added.path).toBe("dist/spa-new");
    }
  });

  it("validateCourseWithInterchange merges spa lessons from lessonkit.json", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-merge-"));
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
      lessonkitJson({
        lessons: [
          {
            id: "ix_spa",
            title: "IX SPA",
            type: "spa",
            path: "dist/lessons/ix-spa",
          },
        ],
        tracking: { completion: { threshold: 0.8 } },
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

    const result = await validateCourseWithInterchange(courseDir);
    expect(result.valid).toBe(true);
    expect(result.manifest?.lessons.some((l) => l.id === "ix_spa")).toBe(true);
    expect(result.manifest?.tracking?.completion?.threshold).toBe(0.8);

    await rm(courseDir, { recursive: true, force: true });
  });

  it("does not retain pre-merge errors when lessonkit.json fixes spa path", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-stale-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });

    await mkdir(join(courseDir, "dist", "good-spa"), { recursive: true });
    await writeFile(
      join(courseDir, "dist", "good-spa", "index.html"),
      "<!doctype html><html><body>spa</body></html>",
    );

    await writeFile(
      join(courseDir, "lessonkit.json"),
      lessonkitJson({
        lessons: [{ id: "ix_spa", type: "spa", path: "dist/good-spa" }],
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
    path: dist/missing-spa
assessments:
  - id: quiz
    file: assessments/quiz.yaml
`,
    );

    const result = await validateCourseWithInterchange(courseDir);
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);

    await rm(courseDir, { recursive: true, force: true });
  });

  it("validateCourseWithInterchange supports assessmentData injection", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-inject-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });
    await rm(join(courseDir, "assessments"), { recursive: true, force: true });
    await writeFile(
      join(courseDir, "course.yaml"),
      `title: Minimal Injected
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md
assessments:
  - id: quiz
    file: assessments/quiz.yaml
`,
    );

    const result = await validateCourseWithInterchange(courseDir, {
      assessmentData: [
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
                { id: "b", text: "B", correct: false },
              ],
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.parsedAssessments?.has("quiz")).toBe(true);

    await rm(courseDir, { recursive: true, force: true });
  });

  it("validateCourseWithInterchange rejects undeclared injected assessments", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-extra-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });
    await rm(join(courseDir, "assessments"), { recursive: true, force: true });
    await writeFile(
      join(courseDir, "course.yaml"),
      `title: Minimal Injected
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md
assessments:
  - id: quiz
    file: assessments/quiz.yaml
`,
    );

    const quizAssessment = {
      id: "quiz",
      title: "Quiz",
      passingScore: 0.7,
      questions: [
        {
          id: "q1",
          prompt: "One?",
          choices: [
            { id: "a", text: "A", correct: true },
            { id: "b", text: "B", correct: false },
          ],
        },
      ],
    };

    const result = await validateCourseWithInterchange(courseDir, {
      assessmentData: [
        quizAssessment,
        { ...quizAssessment, id: "secret_admin_quiz" },
      ],
    });

    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (i) =>
          i.severity === "error" && i.path === "assessments.secret_admin_quiz",
      ),
    ).toBe(true);

    await rm(courseDir, { recursive: true, force: true });
  });

  it("validateCourseWithInterchange returns manifest parse errors after merge", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-parse-"));
    await writeFile(
      join(courseDir, "course.yaml"),
      `title: Bad Merge
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md
`,
    );
    await mkdir(join(courseDir, "lessons"), { recursive: true });
    await writeFile(join(courseDir, "lessons", "intro.md"), "# Intro\n");

    await writeFile(
      join(courseDir, "lessonkit.json"),
      lessonkitJson({
        lessons: [{ id: "intro", type: "spa", path: "dist/x" }],
        tracking: { completion: { threshold: 2 } },
      }),
    );

    const result = await validateCourseWithInterchange(courseDir);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.severity === "error")).toBe(true);

    await rm(courseDir, { recursive: true, force: true });
  });

  it("falls back to validateCourse when no interchange file is present", async () => {
    const result = await validateCourseWithInterchange(
      fixturePath("minimal-valid"),
    );
    expect(result.valid).toBe(true);
  });

  it("rejects symlinked lessonkit.json", async () => {
    const outside = await mkdtemp(join(tmpdir(), "lxpack-ix-out-"));
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-symlink-"));
    await writeFile(
      join(outside, "lessonkit.json"),
      lessonkitJson({
        lessons: [{ id: "ix", type: "spa", path: "dist/ix" }],
      }),
    );
    await symlink(join(outside, "lessonkit.json"), join(courseDir, "lessonkit.json"));

    const result = await loadLessonKitInterchange(courseDir);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.issues[0]?.message).toMatch(
        /Symlink not allowed|Path escapes course directory/,
      );
    }

    await rm(courseDir, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });

  it("returns read error when lessonkit.json is not readable", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-read-"));
    mkdirSync(join(courseDir, "lessonkit.json"));

    const result = await loadLessonKitInterchange(courseDir);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.issues[0]?.message).toContain("Failed to read");
    }

    await rm(courseDir, { recursive: true, force: true });
  });

  it("validateCourseWithInterchange attaches interchange warnings with assessmentData + interchange option", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-warn-"));
    await mkdir(join(courseDir, "dist", "shared"), { recursive: true });
    await writeFile(
      join(courseDir, "dist", "shared", "index.html"),
      "<!doctype html><html><body></body></html>",
    );

    const interchange = {
      format: "lessonkit" as const,
      version: "1" as const,
      course: { title: "Warn Course" },
      lessons: [
        { id: "a", type: "spa" as const, path: "dist/shared" },
        { id: "b", type: "spa" as const, path: "dist/shared" },
      ],
      runtime: { themePreset: "lessonkit:unknown" },
    };

    const result = await validateCourseWithInterchange(courseDir, {
      assessmentData: [],
      interchange,
    });

    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "warning").length).toBeGreaterThan(
      0,
    );

    await rm(courseDir, { recursive: true, force: true });
  });

  it("validateCourseWithInterchange merges interchange when using assessmentData", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-both-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });
    await rm(join(courseDir, "assessments"), { recursive: true, force: true });

    await mkdir(join(courseDir, "dist", "spa"), { recursive: true });
    await writeFile(
      join(courseDir, "dist", "spa", "index.html"),
      "<!doctype html><html><body></body></html>",
    );
    await writeFile(
      join(courseDir, "lessonkit.json"),
      lessonkitJson({
        lessons: [{ id: "ix_spa", type: "spa", path: "dist/spa" }],
      }),
    );
    await writeFile(
      join(courseDir, "course.yaml"),
      `title: Injected
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md
  - id: ix_spa
    type: spa
    path: dist/spa
assessments:
  - id: quiz
    file: assessments/quiz.yaml
`,
    );

    const result = await validateCourseWithInterchange(courseDir, {
      assessmentData: [
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
                { id: "b", text: "B", correct: false },
              ],
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.manifest?.lessons.some((l) => l.id === "ix_spa")).toBe(true);

    await rm(courseDir, { recursive: true, force: true });
  });

  it("returns early when course.yaml fails before interchange merge", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-badcy-"));
    await writeFile(join(courseDir, "course.yaml"), "title: [\nversion: 1\n");
    await writeFile(
      join(courseDir, "lessonkit.json"),
      lessonkitJson({
        lessons: [{ id: "x", type: "spa", path: "dist/x" }],
      }),
    );

    const result = await validateCourseWithInterchange(courseDir);
    expect(result.valid).toBe(false);
    expect(result.manifest).toBeUndefined();

    await rm(courseDir, { recursive: true, force: true });
  });

  it("merges assessments from interchange on standard validate path", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-assess-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });
    await rm(join(courseDir, "assessments"), { recursive: true, force: true });

    await mkdir(join(courseDir, "dist", "spa"), { recursive: true });
    await writeFile(join(courseDir, "dist", "spa", "index.html"), "<html></html>");

    await writeFile(
      join(courseDir, "lessonkit.json"),
      lessonkitJson({
        lessons: [{ id: "ix_spa", type: "spa", path: "dist/spa" }],
        assessments: [
          {
            id: "quiz",
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
      }),
    );

    const result = await validateCourseWithInterchange(courseDir);
    expect(result.valid).toBe(true);
    expect(result.parsedAssessments?.has("quiz")).toBe(true);

    await rm(courseDir, { recursive: true, force: true });
  });

  it("uses in-memory interchange option without on-disk file", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-mem-"));
    await mkdir(join(courseDir, "dist", "x"), { recursive: true });
    await writeFile(
      join(courseDir, "dist", "x", "index.html"),
      "<!doctype html><html><body></body></html>",
    );

    const result = await validateCourseWithInterchange(courseDir, {
      interchange: {
        format: "lessonkit",
        version: "1",
        course: { title: "In memory" },
        lessons: [{ id: "x", type: "spa", path: "dist/x" }],
      },
    });

    expect(result.valid).toBe(true);
    expect(result.manifest?.title).toBe("In memory");

    await rm(courseDir, { recursive: true, force: true });
  });

  it("validates interchange-only project without course.yaml", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-only-"));
    await mkdir(join(courseDir, "dist", "x"), { recursive: true });
    await writeFile(
      join(courseDir, "dist", "x", "index.html"),
      "<!doctype html><html><body>spa</body></html>",
    );
    await writeFile(
      join(courseDir, "lessonkit.json"),
      lessonkitJson({
        course: { title: "Interchange Only" },
        lessons: [{ id: "x", type: "spa", path: "dist/x", title: "SPA" }],
      }),
    );

    const result = await validateCourseWithInterchange(courseDir);
    expect(result.valid).toBe(true);
    expect(result.manifest?.title).toBe("Interchange Only");
    expect(result.manifest?.lessons.some((l) => l.id === "x")).toBe(true);

    await rm(courseDir, { recursive: true, force: true });
  });
});
