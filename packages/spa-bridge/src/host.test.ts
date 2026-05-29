import { describe, expect, it, vi } from "vitest";
import { createLxpackBridgeHost } from "./host.js";

describe("createLxpackBridgeHost", () => {
  it("wires runtime methods", () => {
    const completeLesson = vi.fn();
    const completeCourse = vi.fn();
    const submitAssessment = vi.fn();
    const track = vi.fn();

    const root = createLxpackBridgeHost({
      completeLesson,
      completeCourse,
      submitAssessment,
      track,
    });

    root.v1.completeLesson("a");
    root.v1.completeCourse();
    root.v1.submitAssessment({ id: "q", score: 8, maxScore: 10 });
    root.v1.track?.({ type: "interaction", id: "x" });

    expect(completeLesson).toHaveBeenCalledWith("a");
    expect(completeCourse).toHaveBeenCalled();
    expect(submitAssessment).toHaveBeenCalledWith("q", 0.8, 0.7);
    expect(track).toHaveBeenCalled();
  });
});
