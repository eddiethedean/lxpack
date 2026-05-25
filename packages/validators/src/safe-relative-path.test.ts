import { describe, expect, it } from "vitest";
import {
  validateAssessmentFilePath,
  validateSafeRelativePath,
} from "./safe-relative-path.js";

describe("validateSafeRelativePath", () => {
  it("rejects traversal and invalid characters", () => {
    expect(validateSafeRelativePath("../secrets")).toContain("..");
    expect(validateSafeRelativePath("lessons/a b.md")).toContain("whitespace");
  });

  it("accepts normal lesson paths", () => {
    expect(validateSafeRelativePath("lessons/intro.md")).toBeNull();
  });
});

describe("validateAssessmentFilePath", () => {
  it("requires assessments/ prefix", () => {
    expect(validateAssessmentFilePath("lessons/quiz.yaml")).toContain(
      "assessments/",
    );
    expect(validateAssessmentFilePath("assessments/quiz.yaml")).toBeNull();
  });
});
