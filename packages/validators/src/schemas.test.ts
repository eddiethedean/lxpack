import { describe, it, expect } from "vitest";
import {
  assessmentSchema,
  courseManifestSchema,
  lessonSchema,
} from "./schemas.js";

describe("lessonSchema", () => {
  it("accepts markdown and html lesson shapes", () => {
    expect(
      lessonSchema.safeParse({
        id: "a",
        type: "markdown",
        file: "lessons/a.md",
      }).success,
    ).toBe(true);
    expect(
      lessonSchema.safeParse({
        id: "b",
        type: "html",
        path: "interactions/b",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown lesson types", () => {
    const result = lessonSchema.safeParse({
      id: "x",
      type: "video",
      file: "x.mp4",
    });
    expect(result.success).toBe(false);
  });
});

describe("assessmentSchema", () => {
  it("requires at least one question with choices", () => {
    expect(
      assessmentSchema.safeParse({
        id: "quiz",
        questions: [
          {
            id: "q1",
            prompt: "?",
            choices: [{ id: "a", text: "A", correct: true }],
          },
        ],
      }).success,
    ).toBe(true);

    expect(
      assessmentSchema.safeParse({
        id: "quiz",
        questions: [],
      }).success,
    ).toBe(false);
  });

  it("defaults passingScore to 0.7", () => {
    const parsed = assessmentSchema.parse({
      id: "quiz",
      questions: [
        {
          id: "q1",
          prompt: "?",
          choices: [{ id: "a", text: "A", correct: true }],
        },
      ],
    });
    expect(parsed.passingScore).toBe(0.7);
  });

  it("rejects passingScore outside 0–1", () => {
    expect(
      assessmentSchema.safeParse({
        id: "quiz",
        passingScore: 1.5,
        questions: [
          {
            id: "q1",
            prompt: "?",
            choices: [{ id: "a", text: "A" }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate choice ids in a question", () => {
    const result = assessmentSchema.safeParse({
      id: "quiz",
      questions: [
        {
          id: "q1",
          prompt: "?",
          choices: [
            { id: "a", text: "A", correct: true },
            { id: "a", text: "A again", correct: false },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("courseManifestSchema", () => {
  it("rejects variable default type mismatches", () => {
    expect(
      courseManifestSchema.safeParse({
        title: "T",
        version: "1.0.0",
        variables: { n: { default: "x", type: "number" } },
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
      }).success,
    ).toBe(false);
    expect(
      courseManifestSchema.safeParse({
        title: "T",
        version: "1.0.0",
        variables: { flag: { default: true, type: "string" } },
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
      }).success,
    ).toBe(false);

    expect(
      courseManifestSchema.safeParse({
        title: "T",
        version: "1.0.0",
        variables: { flag: { default: "no", type: "boolean" } },
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
      }).success,
    ).toBe(false);
  });

  it("accepts a valid manifest with tracking and runtime", () => {
    const result = courseManifestSchema.safeParse({
      title: "Test Course",
      version: "1.0.0",
      runtime: { theme: "modern" },
      tracking: { completion: { threshold: 0.8 } },
      lessons: [
        { id: "intro", type: "markdown", file: "lessons/intro.md" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate question ids in an assessment", () => {
    const result = assessmentSchema.safeParse({
      id: "quiz",
      questions: [
        {
          id: "q1",
          prompt: "?",
          choices: [{ id: "a", text: "A", correct: true }],
        },
        {
          id: "q1",
          prompt: "??",
          choices: [{ id: "b", text: "B", correct: true }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown keys in assessment questions", () => {
    const result = assessmentSchema.safeParse({
      id: "quiz",
      questions: [
        {
          id: "q1",
          prompts: "Typo",
          choices: [{ id: "a", text: "A", correct: true }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown keys in strict mode", () => {
    expect(
      courseManifestSchema.safeParse({
        title: "Test",
        version: "1.0.0",
        typo: true,
        lessons: [
          { id: "intro", type: "markdown", file: "lessons/intro.md" },
        ],
      }).success,
    ).toBe(false);
  });

  it("requires at least one correct choice per question", () => {
    expect(
      assessmentSchema.safeParse({
        id: "quiz",
        questions: [
          {
            id: "q1",
            prompt: "?",
            choices: [
              { id: "a", text: "A" },
              { id: "b", text: "B" },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts single-select questions with exactly one correct choice", () => {
    const result = assessmentSchema.safeParse({
      id: "quiz",
      questions: [
        {
          id: "q1",
          prompt: "Pick one",
          selectionMode: "single",
          choices: [
            { id: "a", text: "A", correct: true },
            { id: "b", text: "B" },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects selectionMode single with two correct choices", () => {
    const result = assessmentSchema.safeParse({
      id: "quiz",
      questions: [
        {
          id: "q1",
          prompt: "Pick one",
          selectionMode: "single",
          choices: [
            { id: "a", text: "A", correct: true },
            { id: "b", text: "B", correct: true },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("exactly one"))).toBe(
        true,
      );
    }
  });

  it("accepts multi-select questions with multiple correct choices", () => {
    const result = assessmentSchema.safeParse({
      id: "quiz",
      questions: [
        {
          id: "q1",
          prompt: "Select all",
          choices: [
            { id: "a", text: "A", correct: true },
            { id: "b", text: "B", correct: true },
            { id: "c", text: "C" },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects multi-select with fewer than two correct choices", () => {
    expect(
      assessmentSchema.safeParse({
        id: "quiz",
        questions: [
          {
            id: "q1",
            prompt: "Select all",
            selectionMode: "multiple",
            choices: [
              { id: "a", text: "A", correct: true },
              { id: "b", text: "B" },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects empty title and empty lessons", () => {
    expect(
      courseManifestSchema.safeParse({
        title: "",
        version: "1.0.0",
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
      }).success,
    ).toBe(false);

    expect(
      courseManifestSchema.safeParse({
        title: "Test",
        version: "1.0.0",
        lessons: [],
      }).success,
    ).toBe(false);
  });
});
