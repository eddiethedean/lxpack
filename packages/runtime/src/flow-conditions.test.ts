import { describe, expect, it } from "vitest";
import { variableValuesEqual } from "./flow-conditions.js";

describe("variableValuesEqual", () => {
  it("coerces by declared type", () => {
    expect(variableValuesEqual("1", 1, "number")).toBe(true);
    expect(variableValuesEqual(1, "1", "string")).toBe(true);
    expect(variableValuesEqual(true, true, "boolean")).toBe(true);
    expect(variableValuesEqual(0, false, "boolean")).toBe(false);
    expect(variableValuesEqual(1, true, "boolean")).toBe(false);
  });

  it("uses strict equality when type is omitted", () => {
    expect(variableValuesEqual(1, "1")).toBe(false);
  });

  it("rejects non-finite numbers", () => {
    expect(variableValuesEqual(undefined, undefined, "number")).toBe(false);
    expect(variableValuesEqual("x", "y", "number")).toBe(false);
    expect(variableValuesEqual(Number.NaN, Number.NaN, "number")).toBe(false);
  });
});
