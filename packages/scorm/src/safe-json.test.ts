import { describe, it, expect } from "vitest";
import { safeJsonForHtml } from "./safe-json.js";

describe("safeJsonForHtml", () => {
  it("escapes less-than for script breakout", () => {
    const json = safeJsonForHtml({
      title: 'x</script><img src=x onerror=alert(1)>',
    });
    expect(json).not.toContain("</script>");
    expect(json).toContain("\\u003c/script");
  });
});
