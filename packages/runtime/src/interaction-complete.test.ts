import { describe, expect, it } from "vitest";
import { isInteractionComplete } from "./interaction-complete.js";

describe("isInteractionComplete", () => {
  it("accepts true and explicit complete objects only", () => {
    expect(isInteractionComplete(true)).toBe(true);
    expect(isInteractionComplete({ complete: true })).toBe(true);
    expect(isInteractionComplete({ complete: false })).toBe(false);
    expect(isInteractionComplete({})).toBe(false);
    expect(isInteractionComplete(1)).toBe(false);
    expect(isInteractionComplete(false)).toBe(false);
    expect(isInteractionComplete(null)).toBe(false);
  });
});
