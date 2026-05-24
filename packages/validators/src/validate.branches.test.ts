import { describe, it, expect } from "vitest";
import {
  formatErrorMessage,
  formatIssuePath,
  isPathContained,
  resolveCoursePath,
} from "./validate.js";
import { resolve } from "node:path";

describe("formatErrorMessage", () => {
  it("uses Error message when err is an Error", () => {
    expect(formatErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("stringifies non-Error values", () => {
    expect(formatErrorMessage("disk failure")).toBe("disk failure");
  });
});

describe("isPathContained", () => {
  it("treats the course root as contained", () => {
    const root = resolve("/tmp/course");
    expect(isPathContained(root, root)).toBe(true);
  });
});

describe("resolveCoursePath", () => {
  it("rejects paths that resolve to the course root as files", () => {
    const dir = resolve("/tmp/course");
    const result = resolveCoursePath(dir, ".");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.path).toBe(dir);
    }
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
