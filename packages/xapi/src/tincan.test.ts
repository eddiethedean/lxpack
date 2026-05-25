import { describe, expect, it } from "vitest";
import { generateTincanXml } from "./tincan.js";
import type { CourseManifest } from "@lxpack/validators";

const manifest: CourseManifest = {
  title: "Test",
  version: "1.0.0",
  lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
  assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
};

describe("generateTincanXml", () => {
  it("includes course and activity entries", () => {
    const xml = generateTincanXml(
      manifest,
      "https://example.com/courses/test",
    );
    expect(xml).toContain("https://example.com/courses/test");
    expect(xml).toContain("/activities/intro");
    expect(xml).toContain("/activities/quiz");
    expect(xml).toContain("<launch");
  });
});
