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

  it("errors when injected data contains undeclared assessment id", () => {
    const manifest = {
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    } as const;

    const assessment = {
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
    };

    const result = loadParsedAssessmentsFromData(manifest as never, [
      assessment,
      {
        ...assessment,
        id: "secret_admin_quiz",
      },
    ]);

    expect(
      result.issues.some(
        (i) =>
          i.severity === "error" &&
          i.path === "assessments.secret_admin_quiz" &&
          i.message.includes("not declared"),
      ),
    ).toBe(true);

    const bundleResult = buildRuntimeAssessmentBundleFromData(manifest as never, [
      assessment,
      { ...assessment, id: "secret_admin_quiz" },
    ]);
    expect(bundleResult.issues.some((i) => i.severity === "error")).toBe(true);
    expect(bundleResult.bundle.answerKeys.secret_admin_quiz).toBeUndefined();
  });

  it("errors when manifest has no assessments but data is injected", () => {
    const manifest = {
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
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

    expect(
      result.issues.some(
        (i) => i.severity === "error" && i.path === "assessments.quiz",
      ),
    ).toBe(true);

    const bundleResult = buildRuntimeAssessmentBundleFromData(manifest as never, [
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
    expect(bundleResult.bundle.answerKeys.quiz).toBeUndefined();
  });
});

describe("buildRuntimeAssessmentBundleFromData", () => {
  it("round-trips injected multi-select assessments to array answer keys", () => {
    const manifest = {
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    } as const;

    const result = buildRuntimeAssessmentBundleFromData(manifest as never, [
      {
        id: "quiz",
        passingScore: 0.7,
        questions: [
          {
            id: "q1",
            prompt: "Select all",
            choices: [
              { id: "a", text: "A", correct: true },
              { id: "b", text: "B" },
              { id: "c", text: "C", correct: true },
            ],
          },
        ],
      },
    ]);

    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(result.bundle?.answerKeys.quiz.q1).toEqual(["a", "c"]);
    expect(result.bundle?.assessments.quiz.questions[0]?.selectionMode).toBe(
      "multiple",
    );
    expect(JSON.stringify(result.bundle?.assessments.quiz)).not.toContain(
      '"correct"',
    );
  });

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

