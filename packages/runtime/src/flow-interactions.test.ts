import { describe, it, expect } from "vitest";
import { getFlowProtectedInteractionIds } from "./flow-interactions.js";
import type { CourseManifest } from "@lxpack/validators";

describe("getFlowProtectedInteractionIds", () => {
  it("collects interaction.done ids from flow rules", () => {
    const manifest: CourseManifest = {
      title: "T",
      version: "1.0.0",
      lessons: [
        { id: "lab", type: "html", path: "interactions/lab" },
        { id: "wrap", type: "markdown", file: "lessons/wrap.md" },
      ],
      flow: [
        { when: { interaction: { done: "lab" } }, goto: "wrap" },
      ],
    };
    expect(getFlowProtectedInteractionIds(manifest)).toEqual(new Set(["lab"]));
  });
});
