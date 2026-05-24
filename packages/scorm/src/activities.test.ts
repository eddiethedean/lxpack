import { describe, expect, it } from "vitest";
import { listCourseActivities } from "./activities.js";

describe("listCourseActivities", () => {
  it("lists lessons and assessments with titles", () => {
    const activities = listCourseActivities({
      title: "T",
      version: "1.0.0",
      lessons: [
        { id: "intro", title: "Intro", type: "markdown", file: "a.md" },
      ],
      assessments: [{ id: "final_quiz", file: "assessments/final.yaml" }],
    });
    expect(activities).toEqual([
      { id: "intro", title: "Intro", kind: "lesson" },
      { id: "final_quiz", title: "final quiz", kind: "assessment" },
    ]);
  });

  it("falls back to lesson id when title is omitted", () => {
    const activities = listCourseActivities({
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "only", type: "markdown", file: "a.md" }],
    });
    expect(activities[0]?.title).toBe("only");
  });
});
