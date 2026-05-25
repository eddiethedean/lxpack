import { describe, expect, it } from "vitest";
import { buildBlocks } from "./blocks.js";

describe("buildBlocks", () => {
  it("maps lessons to Completed and assessments to Passed moveOn", () => {
    const blocks = buildBlocks(
      [
        { id: "intro", title: "Intro", kind: "lesson" },
        { id: "quiz", title: "quiz", kind: "assessment" },
      ],
      "https://example.test/courses/demo",
    );
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      id: "block_intro",
      moveOn: "Completed",
      activityId: "https://example.test/courses/demo/activities/intro",
    });
    expect(blocks[1]).toMatchObject({
      id: "block_quiz",
      moveOn: "Passed",
      activityId: "https://example.test/courses/demo/activities/quiz",
    });
  });
});
