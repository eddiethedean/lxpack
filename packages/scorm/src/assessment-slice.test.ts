import { describe, expect, it } from "vitest";
import { buildRuntimeAssessmentBundle } from "@lxpack/validators";
import { fixturePath } from "../../../test/helpers/paths.js";
import { sliceAssessmentBundleForActivity } from "./assessment-slice.js";

describe("sliceAssessmentBundleForActivity", () => {
  it("strips answer keys from lesson SCO bundles", async () => {
    const bundle = await buildRuntimeAssessmentBundle(
      fixturePath("minimal-valid"),
      {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
    );
    const sliced = sliceAssessmentBundleForActivity(bundle, "intro", "lesson");
    expect(sliced.answerKeys).toEqual({});
    expect(sliced.assessments.quiz).toBeDefined();
  });

  it("keeps only the target assessment answer key", async () => {
    const bundle = await buildRuntimeAssessmentBundle(
      fixturePath("minimal-valid"),
      {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
    );
    const sliced = sliceAssessmentBundleForActivity(bundle, "quiz", "assessment");
    expect(Object.keys(sliced.answerKeys)).toEqual(["quiz"]);
    expect(Object.keys(sliced.assessments)).toEqual(["quiz"]);
  });
});
