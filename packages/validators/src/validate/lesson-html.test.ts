import { describe, expect, it } from "vitest";
import {
  validateHtmlLessonPath,
  validateHtmlLesson,
} from "./lesson-html.js";
import { fixturePath } from "../../../../test/helpers/paths.js";
import { loadManifest } from "../validate.js";

describe("validateHtmlLessonPath", () => {
  it("rejects paths with quotes or whitespace", () => {
    expect(validateHtmlLessonPath('interactions/bad"path')).toMatch(/invalid/);
    expect(validateHtmlLessonPath("interactions/bad path")).toMatch(/invalid/);
  });

  it("rejects .. segments", () => {
    expect(validateHtmlLessonPath("interactions/../secret")).toMatch(/\.\./);
  });

  it("accepts safe paths", () => {
    expect(validateHtmlLessonPath("interactions/phishing-lab")).toBeNull();
  });
});

describe("validateHtmlLesson", () => {
  it("validates existing interaction directory", async () => {
    const loaded = await loadManifest(fixturePath("minimal-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const manifest = loaded.manifest;
    const lesson = manifest.lessons.find((l) => l.type === "html");
    if (!lesson || lesson.type !== "html") {
      throw new Error("fixture missing html lesson");
    }
    const issues = validateHtmlLesson(fixturePath("minimal-valid"), lesson);
    expect(issues).toHaveLength(0);
  });
});
