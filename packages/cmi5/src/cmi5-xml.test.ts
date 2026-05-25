import { describe, expect, it } from "vitest";
import { generateCmi5Xml } from "./cmi5-xml.js";
import type { CourseManifest } from "@lxpack/validators";

const manifest: CourseManifest = {
  title: "CMI5 Demo",
  version: "1.0.0",
  tracking: {
    xapi: {
      activityIri: "https://example.com/courses/cmi5-demo",
    },
  },
  lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
  assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
};

describe("generateCmi5Xml", () => {
  it("emits au and blocks per activity", () => {
    const xml = generateCmi5Xml(
      manifest,
      "https://example.com/courses/cmi5-demo",
    );
    expect(xml).toContain("<au ");
    expect(xml).toContain("block_intro");
    expect(xml).toContain("block_quiz");
    expect(xml).toContain("<moveOn>Passed</moveOn>");
    expect(xml).toContain("<moveOn>Completed</moveOn>");
  });
});
