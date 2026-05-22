import { describe, it, expect } from "vitest";
import { generateImsManifest } from "./manifest.js";

describe("generateImsManifest", () => {
  it("generates valid SCORM 1.2 manifest XML", () => {
    const xml = generateImsManifest({
      title: "Security Awareness",
      version: "1.0.0",
      lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
    });

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<schemaversion>1.2</schemaversion>");
    expect(xml).toContain("Security Awareness");
    expect(xml).toContain('adlcp:scormtype="sco"');
  });
});
