import { describe, expect, it } from "vitest";
import {
  assertPackagableFile,
  isLogicalPathAllowedForTarget,
  isSensitiveCourseRel,
} from "./packagable-path.js";

describe("isSensitiveCourseRel", () => {
  it("flags assessments and manifest paths", () => {
    expect(isSensitiveCourseRel("assessments/quiz.yaml")).toBe(true);
    expect(isSensitiveCourseRel("course.yaml")).toBe(true);
    expect(isSensitiveCourseRel("lessons/intro.md")).toBe(false);
  });
});

describe("isLogicalPathAllowedForTarget", () => {
  it("allows assessment paths only under assessments/", () => {
    expect(
      isLogicalPathAllowedForTarget(
        "assessments/quiz.yaml",
        "assessments/quiz.yaml",
      ),
    ).toBe(true);
    expect(
      isLogicalPathAllowedForTarget(
        "lessons/leak.md",
        "assessments/quiz.yaml",
      ),
    ).toBe(false);
  });
});

describe("assertPackagableFile", () => {
  it("rejects missing paths", () => {
    const result = assertPackagableFile("/tmp/none", "/tmp/none/missing.md", "lessons/x.md");
    expect(result.ok).toBe(false);
  });
});
