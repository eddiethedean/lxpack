import { describe, it, expect } from "vitest";
import { buildIndexHtml } from "./build-html.js";

const manifest = {
  title: 'Course <script>alert("x")</script>',
  version: "2.0.0",
  lessons: [{ id: "a", type: "markdown" as const, file: "a.md" }],
};

describe("buildIndexHtml", () => {
  it("embeds escaped title and runtime config", () => {
    const html = buildIndexHtml({
      manifest,
      runtimeCss: "body { color: red; }",
      mode: "scorm12",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Course &lt;script&gt;alert");
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain("lxpack-runtime.js");
    expect(html).toContain('"mode":"scorm12"');
    expect(html).toContain("body { color: red; }");
    expect(html).toContain('id="lxpack-config"');
  });

  it("supports standalone mode in config JSON", () => {
    const html = buildIndexHtml({
      manifest: { title: "T", version: "1.0.0", lessons: manifest.lessons },
      runtimeCss: "",
      mode: "standalone",
    });
    expect(html).toContain('"mode":"standalone"');
  });
});
