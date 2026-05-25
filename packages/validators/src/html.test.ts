import { describe, expect, it } from "vitest";
import { escapeHtml } from "./html.js";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<a "b">&`)).toBe("&lt;a &quot;b&quot;&gt;&amp;");
  });
});
