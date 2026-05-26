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

  it("rejects assessments/ without a file segment", () => {
    expect(validateAssessmentFilePath("assessments/")).toContain(
      "file under assessments/",
    );
    expect(validateAssessmentFilePath("assessments/sub/")).toContain(
      "file under assessments/",
    );
  });
});

describe("validateSafeRelativePath edge cases", () => {
  it("rejects absolute and invalid character paths", () => {
    expect(validateSafeRelativePath("/etc/passwd")).toMatch(/Absolute/);
    expect(validateSafeRelativePath("lessons/a<b.md")).toMatch(/invalid/);
    expect(validateSafeRelativePath("-bad")).toMatch(/start with a letter/);
  });
});
