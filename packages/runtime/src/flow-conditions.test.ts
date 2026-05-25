import { describe, expect, it } from "vitest";
import { variableValuesEqual } from "./flow-conditions.js";

describe("variableValuesEqual", () => {
  it("coerces by declared type", () => {
    expect(variableValuesEqual("1", 1, "number")).toBe(true);
    expect(variableValuesEqual(1, "1", "string")).toBe(true);
    expect(variableValuesEqual(0, false, "boolean")).toBe(true);
  });

  it("uses strict equality when type is omitted", () => {
    expect(variableValuesEqual(1, "1")).toBe(false);
  });
});
