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
    { when: { variable: { eq: ["flag", true] } }, goto: "b" },
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
    expect(resolveFlowGoto(manifest, ctx)).toBe("b");
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
