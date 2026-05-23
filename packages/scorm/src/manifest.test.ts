import { describe, it, expect } from "vitest";
import { generateImsManifest } from "./manifest.js";

const baseManifest = {
  title: "Security Awareness",
  version: "1.0.0",
  lessons: [{ id: "intro", type: "markdown" as const, file: "lessons/intro.md" }],
};

describe("generateImsManifest", () => {
  it("generates valid SCORM 1.2 manifest XML", () => {
    const xml = generateImsManifest(baseManifest);

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<schemaversion>1.2</schemaversion>");
    expect(xml).toContain("Security Awareness");
    expect(xml).toContain('adlcp:scormtype="sco"');
    expect(xml).toContain('href="index.html"');
  });

  it("slugifies title for manifest identifier", () => {
    const xml = generateImsManifest({
      ...baseManifest,
      title: "Hello World 101",
    });
    expect(xml).toContain('identifier="hello-world-101"');
    expect(xml).toContain('default="hello-world-101-org"');
  });

  it("escapes XML special characters in titles", () => {
    const xml = generateImsManifest({
      ...baseManifest,
      title: "A & B <C>",
    });
    expect(xml).toContain("A &amp; B &lt;C&gt;");
    expect(xml).not.toContain("A & B <C>");
  });

  it("uses custom launch URL when provided", () => {
    const xml = generateImsManifest(baseManifest, "launch.html");
    expect(xml).toContain('href="launch.html"');
  });
});
