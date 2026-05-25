import { describe, expect, it } from "vitest";
import { enumerateActivities } from "./activities.js";
import type { CourseManifest } from "./schemas.js";

describe("enumerateActivities", () => {
  it("lists lessons and assessments", () => {
    const manifest: CourseManifest = {
      title: "T",
      version: "1.0.0",
      lessons: [
        { id: "intro", type: "markdown", file: "a.md", title: "Intro" },
      ],
      assessments: [{ id: "final_quiz", file: "assessments/f.yaml" }],
    };
    expect(enumerateActivities(manifest)).toEqual([
      { id: "intro", title: "Intro", kind: "lesson" },
      { id: "final_quiz", title: "final quiz", kind: "assessment" },
    ]);
  });

  it("falls back to lesson id when title is omitted", () => {
    const manifest: CourseManifest = {
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "bare", type: "markdown", file: "a.md" }],
    };
    expect(enumerateActivities(manifest)[0]?.title).toBe("bare");
  });
});
