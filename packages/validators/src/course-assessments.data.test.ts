import { describe, expect, it } from "vitest";
import {
  buildRuntimeAssessmentBundleFromData,
  loadParsedAssessmentsFromData,
} from "./course-assessments.js";

describe("loadParsedAssessmentsFromData", () => {
  it("parses valid assessment objects and indexes by id", () => {
    const manifest = {
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    } as const;

    const result = loadParsedAssessmentsFromData(manifest as never, [
      {
        id: "quiz",
        passingScore: 0.7,
        questions: [
          {
            id: "q1",
            prompt: "P",
            choices: [
              { id: "a", text: "A", correct: true },
              { id: "b", text: "B", correct: false },
            ],
          },
        ],
      },
    ]);

    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(result.parsed.get("quiz")?.id).toBe("quiz");
  });

  it("errors when a declared assessment is missing from injected data", () => {
    const manifest = {
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    } as const;

    const result = loadParsedAssessmentsFromData(manifest as never, []);
    expect(result.issues.some((i) => i.severity === "error")).toBe(true);
  });
});

describe("buildRuntimeAssessmentBundleFromData", () => {
  it("returns errors when injected data is invalid", () => {
    const manifest = {
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    } as const;

    const result = buildRuntimeAssessmentBundleFromData(manifest as never, [
      { id: "quiz", questions: [] },
    ]);
    expect(result.issues.some((i) => i.severity === "error")).toBe(true);
  });
});

