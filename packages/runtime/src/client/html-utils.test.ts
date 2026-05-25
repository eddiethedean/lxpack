import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./html-utils.js";

describe("sanitizeHtml", () => {
  it("strips javascript: links from markdown HTML", () => {
    const html = sanitizeHtml(
      '<a href="javascript:alert(1)">click</a><img src="javascript:evil()">',
    );
    expect(html.toLowerCase()).not.toContain("javascript:");
  });

  it("allows https links", () => {
    const html = sanitizeHtml('<a href="https://example.test/doc">ok</a>');
    expect(html).toContain("https://example.test/doc");
  });
});
