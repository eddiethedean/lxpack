import { describe, it, expect } from "vitest";
import { generateImsManifest, manifestIdentifier } from "./manifest.js";

const baseManifest = {
  title: "Security Awareness",
  version: "1.0.0",
  lessons: [{ id: "intro", type: "markdown" as const, file: "lessons/intro.md" }],
};

const sampleFiles = ["index.html", "lxpack-runtime.js", "lessons/intro.md"];

describe("manifestIdentifier", () => {
  it("slugifies latin titles", () => {
    expect(manifestIdentifier({ ...baseManifest, title: "Hello World 101" })).toBe(
      "hello-world-101",
    );
  });

  it("falls back to hash for non-latin titles", () => {
    expect(manifestIdentifier({ ...baseManifest, title: "!!!" })).toMatch(
      /^course-\d+$/,
    );
  });
});

describe("generateImsManifest", () => {
  it("generates valid SCORM 1.2 manifest XML", () => {
    const xml = generateImsManifest(baseManifest, sampleFiles);

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<schemaversion>1.2</schemaversion>");
    expect(xml).toContain("Security Awareness");
    expect(xml).toContain('adlcp:scormtype="sco"');
    expect(xml).toContain('href="index.html"');
    expect(xml).toContain('href="lessons/intro.md"');
  });

  it("slugifies title for manifest identifier", () => {
    const xml = generateImsManifest(
      { ...baseManifest, title: "Hello World 101" },
      sampleFiles,
    );
    expect(xml).toContain('identifier="hello-world-101"');
    expect(xml).toContain('default="hello-world-101-org"');
  });

  it("escapes XML special characters in titles and version", () => {
    const xml = generateImsManifest(
      { ...baseManifest, title: "A & B <C>", version: '1.0"beta' },
      sampleFiles,
    );
    expect(xml).toContain("A &amp; B &lt;C&gt;");
    expect(xml).toContain('version="1.0&quot;beta"');
    expect(xml).not.toContain("A & B <C>");
  });

  it("uses custom launch URL when provided", () => {
    const xml = generateImsManifest(baseManifest, sampleFiles, "launch.html");
    expect(xml).toContain('href="launch.html"');
  });

  it("derives mastery score from tracking threshold", () => {
    const xml = generateImsManifest(
      {
        ...baseManifest,
        tracking: { completion: { threshold: 0.75 } },
      },
      sampleFiles,
    );
    expect(xml).toContain("<adlcp:masteryscore>75</adlcp:masteryscore>");
  });
});
