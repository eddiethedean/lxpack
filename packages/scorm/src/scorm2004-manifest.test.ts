import { describe, it, expect } from "vitest";
import { fixturePath } from "../../../test/helpers/paths.js";
import { loadManifest } from "@lxpack/validators";
import {
  generateScorm2004Manifest,
  scoLaunchPath,
  buildScorm2004ManifestFiles,
} from "./scorm2004-manifest.js";

describe("generateScorm2004Manifest", () => {
  it("emits multi-SCO manifest with IMS Simple Sequencing", async () => {
    const loaded = await loadManifest(fixturePath("branching-demo"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");

    const files = buildScorm2004ManifestFiles(loaded.manifest, [
      "lessons/intro.md",
    ]);
    const xml = generateScorm2004Manifest(loaded.manifest, files);

    expect(xml).toContain("<schemaversion>2004 4th Edition</schemaversion>");
    expect(xml).toContain('adlcp:scormType="sco"');
    expect(xml).toContain(`href="${scoLaunchPath("intro")}"`);
    expect(xml).toContain('xmlns:imsss="http://www.imsglobal.org/xsd/imsss"');
    expect(xml).toContain("<imsss:sequencing>");
    expect(xml).toContain('identifier="item_intro"');
    expect(xml).toContain('identifier="item_final_quiz"');
  });
});
