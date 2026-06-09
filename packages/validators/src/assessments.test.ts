import { describe, it, expect } from "vitest";
import { fixturePath } from "../../../test/helpers/paths.js";
import { toLearnerAssessment } from "./assessments.js";
import { buildRuntimeAssessmentBundle } from "./course-assessments.js";
import { assessmentSchema } from "./schemas.js";
describe("buildRuntimeAssessmentBundle", () => {
  it("returns empty maps when the manifest has no assessments", async () => {
    const bundle = await buildRuntimeAssessmentBundle(
      fixturePath("missing-markdown"),
      {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
      },
    );
    expect(bundle.assessments).toEqual({});
    expect(bundle.answerKeys).toEqual({});
  });

  it("returns empty maps for an empty assessments array", async () => {
    const bundle = await buildRuntimeAssessmentBundle(
      fixturePath("missing-markdown"),
      {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
        assessments: [],
      },
    );
    expect(bundle.assessments).toEqual({});
  });

  it("builds multi-select answer keys from fixture assessments", async () => {
    const bundle = await buildRuntimeAssessmentBundle(
      fixturePath("multi-select-valid"),
      {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
    );

    expect(bundle.answerKeys.quiz.q1).toEqual(["a", "c"]);
    expect(bundle.assessments.quiz.questions[0]?.selectionMode).toBe("multiple");
  });

  it("strips correct flags from learner assessments", async () => {
    const bundle = await buildRuntimeAssessmentBundle(
      fixturePath("minimal-valid"),
      {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
    );

    expect(bundle.assessments.quiz).toBeDefined();
    expect(bundle.answerKeys.quiz.q1).toBeDefined();
    const yaml = JSON.stringify(bundle.assessments.quiz);
    expect(yaml).not.toContain('"correct"');
  });
});

describe("buildRuntimeAssessmentBundle errors", () => {
  it("throws when assessment path escapes the course", async () => {
    await expect(
      buildRuntimeAssessmentBundle("/tmp", {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
        assessments: [{ id: "quiz", file: "../outside.yaml" }],
      }),
    ).rejects.toThrow(/\.\.|assessments\//);
  });

  it("throws for invalid assessment YAML", async () => {
    await expect(
      buildRuntimeAssessmentBundle(fixturePath("bad-assessment"), {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
        assessments: [{ id: "quiz", file: "assessments/broken.yaml" }],
      }),
    ).rejects.toThrow(/broken\.yaml|questions/);
  });

  it("throws when assessment id mismatches manifest", async () => {
    await expect(
      buildRuntimeAssessmentBundle(fixturePath("minimal-valid"), {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
        assessments: [{ id: "wrong-id", file: "assessments/quiz.yaml" }],
      }),
    ).rejects.toThrow("does not match manifest");
  });
});

describe("toLearnerAssessment", () => {
  it("builds answer keys from correct choices", () => {
    const assessment = assessmentSchema.parse({
      id: "quiz",
      passingScore: 0.8,
      questions: [
        {
          id: "q1",
          prompt: "P",
          choices: [
            { id: "a", text: "A", correct: true },
            { id: "b", text: "B" },
          ],
        },
      ],
    });
    const { learner, answerKey, feedback, config } =
      toLearnerAssessment(assessment);
    expect(answerKey.q1).toBe("a");
    expect(learner.questions[0]?.choices[0]).toEqual({ id: "a", text: "A" });
    expect(feedback.q1).toBeUndefined();
    expect(config.maxAttempts).toBe(1);
  });

  it("builds array answer keys for multi-select questions", () => {
    const assessment = assessmentSchema.parse({
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
    const { learner, answerKey } = toLearnerAssessment(assessment);
    expect(answerKey.q1).toEqual(["a", "b"]);
    expect(learner.questions[0]?.selectionMode).toBe("multiple");
  });

  it("embeds explanations and assessment options in bundle metadata", () => {
    const assessment = assessmentSchema.parse({
      id: "quiz",
      passingScore: 0.8,
      maxAttempts: 3,
      shuffleChoices: true,
      showFeedback: "immediate",
      questions: [
        {
          id: "q1",
          prompt: "P",
          explanation: "Because.",
          choices: [{ id: "a", text: "A", correct: true }],
        },
      ],
    });
    const { feedback, config } = toLearnerAssessment(assessment);
    expect(feedback.q1).toBe("Because.");
    expect(config).toEqual({
      maxAttempts: 3,
      shuffleChoices: true,
      showFeedback: "immediate",
    });
  });
});

