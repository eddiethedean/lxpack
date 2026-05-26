import { describe, expect, it } from "vitest";
import {
  collectFlowInteractionDoneIds,
  enumerateActivities,
} from "./browser.js";

describe("validators browser entry", () => {
  it("exports runtime helpers without Node-only APIs", () => {
    const manifest = {
      title: "T",
      version: "1.0.0",
      lessons: [
        { id: "lab", type: "html" as const, path: "interactions/lab" },
      ],
      flow: [{ when: { interaction: { done: "lab" } }, goto: "wrap" }],
    };
    expect(enumerateActivities(manifest).map((a) => a.id)).toEqual(["lab"]);
    expect(collectFlowInteractionDoneIds(manifest)).toEqual(new Set(["lab"]));
  });
});
