import { beforeEach, describe, expect, it, vi } from "vitest";
import { sanitizeHtml } from "./html-utils.js";

describe("sanitizeHtml", () => {
  beforeEach(() => {
    vi.stubGlobal("alert", vi.fn());
  });

  it("removes script tags and event handlers", () => {
    const dirty =
      '<p>ok</p><script>alert(1)</script><img src="x" onerror="alert(1)">';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onerror");
    expect(clean).toContain("ok");
  });
});
