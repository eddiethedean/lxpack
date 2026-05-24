import { describe, expect, it } from "vitest";
import { getComponentMount, listBuiltinComponentIds } from "./registry.js";
import "./builtins.js";

describe("components registry", () => {
  it("registers built-in components", () => {
    expect(listBuiltinComponentIds()).toContain("callout");
    expect(getComponentMount("callout")).toBeTypeOf("function");
  });
});
