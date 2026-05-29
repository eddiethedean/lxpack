import { describe, expect, it } from "vitest";
import {
  interchangeToManifest,
  lessonkitInterchangeSchema,
  parseLessonkitInterchange,
} from "./lessonkit-interchange.js";
import { mergeInterchangeIntoManifest } from "./interchange.js";
import type { CourseManifest } from "./schemas.js";

const validInterchange = {
  format: "lessonkit" as const,
  version: "1" as const,
  course: { id: "demo", title: "Demo Course" },
  lessons: [
    {
      id: "spa1",
      type: "spa" as const,
      path: "dist/spa1",
      title: "SPA One",
    },
  ],
  tracking: { completion: { threshold: 0.85 } },
  runtime: {
    theme: "brand",
    cssVariables: { "--lk-primary": "#2563eb" },
  },
};

describe("lessonkitInterchangeSchema", () => {
  it("accepts a valid v1 interchange document", () => {
    const result = lessonkitInterchangeSchema.safeParse(validInterchange);
    expect(result.success).toBe(true);
  });

  it("rejects missing format and version", () => {
    const result = parseLessonkitInterchange({
      lessons: [{ id: "a", type: "spa", path: "dist/a" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it("interchangeToManifest produces a valid course manifest", () => {
    const manifest = interchangeToManifest(validInterchange);
    expect(manifest.title).toBe("Demo Course");
    expect(manifest.lessons).toHaveLength(1);
    expect(manifest.lessons[0]?.type).toBe("spa");
    if (manifest.lessons[0]?.type === "spa") {
      expect(manifest.lessons[0].path).toBe("dist/spa1");
    }
    expect(manifest.tracking?.completion?.threshold).toBe(0.85);
    expect(manifest.runtime?.cssVariables?.["--lk-primary"]).toBe("#2563eb");
  });

  it("uses course id as title when title is omitted", () => {
    const manifest = interchangeToManifest({
      ...validInterchange,
      course: { id: "course-id-only" },
    });
    expect(manifest.title).toBe("course-id-only");
  });

  it("resolves spa path from build.outputDir", () => {
    const manifest = interchangeToManifest({
      format: "lessonkit",
      version: "1",
      lessons: [
        {
          id: "spa2",
          type: "spa",
          build: { outputDir: "dist/built" },
        },
      ],
    });
    const lesson = manifest.lessons[0];
    expect(lesson?.type).toBe("spa");
    if (lesson?.type === "spa") {
      expect(lesson.path).toBe("dist/built");
    }
  });

  it("includes assessment refs from interchange", () => {
    const manifest = interchangeToManifest({
      ...validInterchange,
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
    });
    expect(manifest.assessments?.[0]?.id).toBe("quiz");
  });

  it("mergeInterchangeIntoManifest applies runtime cssVariables", () => {
    const base: CourseManifest = {
      title: "Base",
      version: "1.0.0",
      lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
    };
    const merged = mergeInterchangeIntoManifest(base, validInterchange);
    expect(merged.runtime?.cssVariables?.["--lk-primary"]).toBe("#2563eb");
    expect(merged.lessons.some((l) => l.id === "spa1")).toBe(true);
  });
});
