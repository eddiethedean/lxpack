import { describe, it, expect } from "vitest";
import { buildIndexHtml } from "./build-html.js";

const manifest = {
  title: 'Course <script>alert("x")</script>',
  version: "2.0.0",
  lessons: [{ id: "a", type: "markdown" as const, file: "a.md" }],
};

describe("buildIndexHtml", () => {
  it("escapes script breakouts in embedded JSON config", () => {
    const html = buildIndexHtml({
      manifest: {
        title: 'x</script><img src=x onerror=alert(1)>',
        version: "1.0.0",
        lessons: manifest.lessons,
      },
      runtimeCss: "",
      mode: "standalone",
    });
    expect(html).not.toMatch(/<script[^>]*>[\s\S]*<\/script><img/);
    expect(html).toContain("\\u003c/script");
  });

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

  it("embeds assessment bundle in config when provided", () => {
    const html = buildIndexHtml({
      manifest: { title: "T", version: "1.0.0", lessons: manifest.lessons },
      runtimeCss: "",
      mode: "standalone",
      assessmentBundle: {
        assessments: {
          quiz: {
            id: "quiz",
            passingScore: 0.7,
            questions: [
              {
                id: "q1",
                prompt: "P",
                choices: [{ id: "a", text: "A" }],
              },
            ],
          },
        },
        answerKeys: { quiz: { q1: "a" } },
      },
    });
    expect(html).toContain('"assessments"');
    expect(html).toContain('"answerKeys"');
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
