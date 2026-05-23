import { describe, it, expect } from "vitest";
import { formatErrorMessage, formatIssuePath } from "./validate.js";

describe("formatErrorMessage", () => {
  it("uses Error message when err is an Error", () => {
    expect(formatErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("stringifies non-Error values", () => {
    expect(formatErrorMessage("disk failure")).toBe("disk failure");
  });
});

describe("formatIssuePath", () => {
  it("joins zod issue paths", () => {
    expect(formatIssuePath(["lessons", 0, "id"])).toBe("lessons.0.id");
  });

  it("falls back to course.yaml for empty paths", () => {
    expect(formatIssuePath([])).toBe("course.yaml");
  });
});
