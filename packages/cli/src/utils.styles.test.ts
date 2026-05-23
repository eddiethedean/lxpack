import { describe, expect, it } from "vitest";
import { getEmbeddedStyles, loadRuntimeStyles } from "./utils.js";

describe("loadRuntimeStyles", () => {
  it("returns embedded styles when no css files exist", async () => {
    const css = await loadRuntimeStyles("/nonexistent/assets");
    expect(css).toBe(getEmbeddedStyles());
  });
});
