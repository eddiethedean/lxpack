import { describe, expect, it, vi } from "vitest";
import {
  collectActivityIds,
  detectFlowCycles,
  validateFlow,
} from "./flow-validate.js";
import type { CourseManifest } from "./schemas.js";

const baseManifest: CourseManifest = {
  title: "Test",
  version: "1.0.0",
  lessons: [
    { id: "intro", type: "markdown", file: "lessons/intro.md" },
    { id: "lab", type: "html", path: "interactions/lab" },
  ],
  assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
  variables: {
    track: { default: "a" },
  },
};

describe("validateFlow", () => {
  it("accepts valid flow rules", () => {
    const manifest: CourseManifest = {
      ...baseManifest,
      flow: [
        {
          when: { variable: { eq: ["track", "b"] } },
          goto: "lab",
        },
        {
          when: { assessment: { passed: "quiz" } },
          goto: "intro",
        },
      ],
    };
    const issues = validateFlow(manifest);
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("rejects unknown goto target", () => {
    const issues = validateFlow({
      ...baseManifest,
      flow: [{ when: { variable: { eq: ["track", "a"] } }, goto: "missing" }],
    });
    expect(issues.some((i) => i.path.includes("goto"))).toBe(true);
  });

  it("rejects unknown variable in condition", () => {
    const issues = validateFlow({
      ...baseManifest,
      flow: [{ when: { variable: { eq: ["nope", 1] } }, goto: "lab" }],
    });
    expect(issues.some((i) => i.message.includes("Unknown variable"))).toBe(true);
  });

  it("rejects unknown assessment in condition", () => {
    const issues = validateFlow({
      ...baseManifest,
      flow: [{ when: { assessment: { passed: "missing" } }, goto: "lab" }],
    });
    expect(issues.some((i) => i.message.includes("Unknown assessment"))).toBe(
      true,
    );
  });

  it("warns on unknown interaction id", () => {
    const issues = validateFlow({
      ...baseManifest,
      flow: [{ when: { interaction: { done: "ghost" } }, goto: "lab" }],
    });
    expect(issues.some((i) => i.severity === "warning")).toBe(true);
  });

  it("validates nested all/any conditions", () => {
    const issues = validateFlow({
      ...baseManifest,
      flow: [
        {
          when: {
            all: [
              { variable: { eq: ["track", "a"] } },
              { any: [{ assessment: { passed: "quiz" } }] },
            ],
          },
          goto: "intro",
        },
      ],
    });
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("returns no issues when flow is omitted", () => {
    expect(validateFlow({ ...baseManifest, flow: undefined })).toEqual([]);
  });

  it("validates flow when manifest has no variables section", () => {
    const { variables: _removed, ...noVars } = baseManifest;
    const issues = validateFlow({
      ...noVars,
      flow: [{ when: { assessment: { passed: "quiz" } }, goto: "intro" }],
    });
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});

describe("detectFlowCycles", () => {
  it("detects goto cycles when rules chain back to an earlier index", () => {
    const flow = [
      { when: { variable: { eq: ["track", "a"] } }, goto: "lab" },
      { when: { variable: { eq: ["track", "b"] } }, goto: "lab" },
    ];
    let findIndexCalls = 0;
    const findIndexSpy = vi.spyOn(flow, "findIndex").mockImplementation((predicate) => {
      findIndexCalls++;
      if (findIndexCalls === 2) return 0;
      return Array.prototype.findIndex.call(flow, predicate);
    });
    expect(detectFlowCycles(flow).some((e) => e.includes("cycle"))).toBe(true);
    findIndexSpy.mockRestore();
  });

  it("returns empty when no cycle", () => {
    const flow = [
      { when: { variable: { eq: ["track", "a"] } }, goto: "lab" },
      { when: { variable: { eq: ["track", "b"] } }, goto: "intro" },
    ];
    expect(detectFlowCycles(flow)).toEqual([]);
  });

  it("stops when a rule index was already visited in an earlier pass", () => {
    const flow = [
      { when: { variable: { eq: ["track", "a"] } }, goto: "lab" },
      { when: { variable: { eq: ["track", "b"] } }, goto: "intro" },
      { when: { variable: { eq: ["track", "c"] } }, goto: "quiz" },
    ];
    let findIndexCalls = 0;
    const findIndexSpy = vi.spyOn(flow, "findIndex").mockImplementation((predicate) => {
      findIndexCalls++;
      if (findIndexCalls === 3) return 1;
      return Array.prototype.findIndex.call(flow, predicate);
    });
    expect(detectFlowCycles(flow)).toEqual([]);
    findIndexSpy.mockRestore();
  });
});

describe("collectActivityIds", () => {
  it("includes lessons and assessments", () => {
    const ids = collectActivityIds(baseManifest);
    expect(ids.has("intro")).toBe(true);
    expect(ids.has("quiz")).toBe(true);
  });

  it("omits assessments when none are declared", () => {
    const ids = collectActivityIds({
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "only", type: "markdown", file: "lessons/only.md" }],
    });
    expect(ids.has("only")).toBe(true);
    expect(ids.size).toBe(1);
  });
});
