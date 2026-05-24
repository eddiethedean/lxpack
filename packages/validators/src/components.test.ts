import { describe, expect, it } from "vitest";
import { BUILTIN_COMPONENT_IDS, isBuiltinComponentId } from "./components.js";

describe("isBuiltinComponentId", () => {
  it("recognizes built-in ids", () => {
    for (const id of BUILTIN_COMPONENT_IDS) {
      expect(isBuiltinComponentId(id)).toBe(true);
    }
    expect(isBuiltinComponentId("unknown")).toBe(false);
  });
});
