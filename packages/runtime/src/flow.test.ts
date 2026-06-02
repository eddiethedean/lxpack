import { describe, expect, it } from "vitest";
import {
  buildActivityOrder,
  evaluateCondition,
  resolveFlowGoto,
  resolveLinearAdjacent,
  resolveNextActivityId,
  resolvePreviousActivityId,
} from "./flow.js";
import type { CourseManifest } from "@lxpack/validators";

const manifest: CourseManifest = {
  title: "T",
  version: "1",
  lessons: [
    { id: "a", type: "markdown", file: "a.md" },
    { id: "b", type: "markdown", file: "b.md" },
  ],
  variables: { flag: { default: false, type: "boolean" } },
  flow: [
    { from: "a", when: { variable: { eq: ["flag", true] } }, goto: "b" },
  ],
};

describe("flow", () => {
  it("evaluates variable equality", () => {
    const ctx = {
      getVariable: (n: string) => (n === "flag" ? true : undefined),
      isAssessmentPassed: () => false,
      isInteractionDone: () => false,
    };
    expect(
      evaluateCondition({ variable: { eq: ["flag", true] } }, ctx),
    ).toBe(true);
  });

  it("resolves flow goto", () => {
    const ctx = {
      getVariable: () => true,
      isAssessmentPassed: () => false,
      isInteractionDone: () => false,
    };
    expect(resolveFlowGoto(manifest, ctx, "a")).toBe("b");
    expect(resolveFlowGoto(manifest, ctx, "b")).toBeNull();
  });

  it("only applies variable flow rules from the current activity when from is set", () => {
    const withFrom = {
      ...manifest,
      flow: [
        { from: "a", when: { variable: { eq: ["flag", true] } }, goto: "b" },
      ],
    };
    const ctx = {
      getVariable: () => true,
      isAssessmentPassed: () => false,
      isInteractionDone: () => false,
    };
    expect(resolveFlowGoto(withFrom, ctx, "a")).toBe("b");
    expect(resolveFlowGoto(withFrom, ctx, "b")).toBeNull();
  });

  it("infers from for assessment.passed rules", () => {
    const flowManifest = {
      title: "T",
      version: "1",
      lessons: [{ id: "wrap", type: "markdown" as const, file: "wrap.md" }],
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      flow: [{ when: { assessment: { passed: "quiz" } }, goto: "wrap" }],
    };
    const ctx = {
      getVariable: () => false,
      isAssessmentPassed: (id: string) => id === "quiz",
      isInteractionDone: () => false,
    };
    expect(resolveFlowGoto(flowManifest, ctx, "quiz")).toBe("wrap");
    expect(resolveFlowGoto(flowManifest, ctx, "wrap")).toBeNull();
  });

  it("infers from nested all conditions", () => {
    const flowManifest = {
      title: "T",
      version: "1",
      lessons: [
        { id: "lab", type: "html" as const, path: "interactions/lab" },
        { id: "wrap", type: "markdown" as const, file: "wrap.md" },
      ],
      flow: [
        {
          when: {
            all: [
              { interaction: { done: "lab" } },
              { variable: { eq: ["flag", true] } },
            ],
          },
          goto: "wrap",
        },
      ],
      variables: { flag: { default: false, type: "boolean" as const } },
    };
    const ctx = {
      getVariable: () => true,
      isAssessmentPassed: () => false,
      isInteractionDone: (id: string) => id === "lab",
    };
    expect(resolveFlowGoto(flowManifest, ctx, "lab")).toBe("wrap");
    expect(resolveFlowGoto(flowManifest, ctx, "wrap")).toBeNull();
  });

  it("infers from nested any conditions", () => {
    const flowManifest = {
      title: "T",
      version: "1",
      lessons: [{ id: "wrap", type: "markdown" as const, file: "wrap.md" }],
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      flow: [
        {
          when: { any: [{ assessment: { passed: "quiz" } }] },
          goto: "wrap",
        },
      ],
    };
    const ctx = {
      getVariable: () => false,
      isAssessmentPassed: (id: string) => id === "quiz",
      isInteractionDone: () => false,
    };
    expect(resolveFlowGoto(flowManifest, ctx, "quiz")).toBe("wrap");
    expect(resolveFlowGoto(flowManifest, ctx, "wrap")).toBeNull();
  });

  it("infers from all branches in nested any conditions", () => {
    const flowManifest = {
      title: "T",
      version: "1",
      lessons: [
        { id: "lab", type: "html" as const, path: "interactions/lab" },
        { id: "wrap", type: "markdown" as const, file: "wrap.md" },
      ],
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      flow: [
        {
          when: {
            any: [
              { assessment: { passed: "quiz" } },
              { interaction: { done: "lab" } },
            ],
          },
          goto: "wrap",
        },
      ],
    };
    const quizCtx = {
      getVariable: () => false,
      isAssessmentPassed: (id: string) => id === "quiz",
      isInteractionDone: () => false,
    };
    const labCtx = {
      getVariable: () => false,
      isAssessmentPassed: () => false,
      isInteractionDone: (id: string) => id === "lab",
    };
    expect(resolveFlowGoto(flowManifest, quizCtx, "quiz")).toBe("wrap");
    expect(resolveFlowGoto(flowManifest, labCtx, "lab")).toBe("wrap");
    expect(resolveFlowGoto(flowManifest, labCtx, "wrap")).toBeNull();
  });

  it("infers from for interaction.done rules", () => {
    const flowManifest = {
      title: "T",
      version: "1",
      lessons: [
        { id: "lab", type: "html" as const, path: "interactions/lab" },
        { id: "wrap", type: "markdown" as const, file: "wrap.md" },
      ],
      flow: [{ when: { interaction: { done: "lab" } }, goto: "wrap" }],
    };
    const ctx = {
      getVariable: () => false,
      isAssessmentPassed: () => false,
      isInteractionDone: (id: string) => id === "lab",
    };
    expect(resolveFlowGoto(flowManifest, ctx, "lab")).toBe("wrap");
    expect(resolveFlowGoto(flowManifest, ctx, "wrap")).toBeNull();
  });

  it("falls back to linear next", () => {
    const ctx = {
      getVariable: () => false,
      isAssessmentPassed: () => false,
      isInteractionDone: () => false,
    };
    expect(resolveNextActivityId(manifest, "a", ctx)).toBe("b");
  });

  it("evaluates assessment, interaction, all, and any conditions", () => {
    const ctx = {
      getVariable: () => false,
      isAssessmentPassed: (id: string) => id === "quiz",
      isInteractionDone: (id: string) => id === "lab",
    };
    expect(evaluateCondition({ assessment: { passed: "quiz" } }, ctx)).toBe(true);
    expect(evaluateCondition({ interaction: { done: "lab" } }, ctx)).toBe(true);
    expect(
      evaluateCondition(
        { all: [{ assessment: { passed: "quiz" } }, { interaction: { done: "lab" } }] },
        ctx,
      ),
    ).toBe(true);
    expect(
      evaluateCondition({ any: [{ variable: { eq: ["flag", true] } }] }, ctx),
    ).toBe(false);
    expect(evaluateCondition({ unknown: true } as never, ctx)).toBe(false);
    expect(evaluateCondition({ variable: { eq: ["x", 1] } }, ctx)).toBe(false);
  });

  it("coerces variable equality when getVariableType is provided", () => {
    const ctx = {
      getVariable: () => 1,
      getVariableType: () => "number" as const,
      isAssessmentPassed: () => false,
      isInteractionDone: () => false,
    };
    expect(
      evaluateCondition({ variable: { eq: ["score", "1"] } }, ctx),
    ).toBe(true);
  });

  it("uses linear next when flow goto is the current activity", () => {
    const ctx = {
      getVariable: () => true,
      isAssessmentPassed: () => false,
      isInteractionDone: () => false,
    };
    const withSelfGoto = {
      ...manifest,
      flow: [{ when: { variable: { eq: ["flag", true] } }, goto: "a" }],
    };
    expect(resolveNextActivityId(withSelfGoto, "a", ctx)).toBe("b");
    expect(resolveFlowGoto(withSelfGoto, ctx, "a")).toBe("a");
  });

  it("returns explicit flow target when it differs from current", () => {
    const ctx = {
      getVariable: () => true,
      isAssessmentPassed: () => false,
      isInteractionDone: () => false,
    };
    expect(resolveNextActivityId(manifest, "a", ctx)).toBe("b");
  });

  it("resolves previous activity and skips flow goto to current id", () => {
    const ctx = {
      getVariable: () => true,
      isAssessmentPassed: () => false,
      isInteractionDone: () => false,
    };
    expect(resolvePreviousActivityId(manifest, "b")).toBe("a");
    const linearOnly = {
      title: "T",
      version: "1",
      lessons: manifest.lessons,
    };
    expect(resolveNextActivityId(linearOnly, "b", ctx)).toBeNull();
    expect(buildActivityOrder(manifest)).toEqual(["a", "b"]);
    expect(resolveLinearAdjacent(manifest, "missing", 1)).toBeNull();
  });
});
