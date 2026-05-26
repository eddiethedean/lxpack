import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  validateHtmlLessonPath,
  validateHtmlLesson,
  warnDirectLxpackApiInInteractionHtml,
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

  it("normalizes backslashes before validation", () => {
    expect(validateHtmlLessonPath("interactions\\phishing-lab")).toBeNull();
    expect(validateHtmlLessonPath("interactions\\..\\secret")).toMatch(/\.\./);
  });
});

describe("warnDirectLxpackApiInInteractionHtml", () => {
  it("warns when index.html uses window.lxpack without parent", () => {
    const issue = warnDirectLxpackApiInInteractionHtml(
      'window.lxpack?.track({ type: "interaction" });',
      "lessons.lab.path",
    );
    expect(issue?.severity).toBe("warning");
    expect(issue?.message).toContain("window.parent.lxpack");
  });

  it("does not warn when parent.lxpack is used", () => {
    expect(
      warnDirectLxpackApiInInteractionHtml(
        "window.parent.lxpack.track({ type: 'interaction' });",
        "lessons.lab.path",
      ),
    ).toBeNull();
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
    const issues = await validateHtmlLesson(
      fixturePath("minimal-valid"),
      lesson,
    );
    expect(issues).toHaveLength(0);
  });

  it("warns when interaction index.html calls window.lxpack directly", async () => {
    const { mkdtemp, writeFile, cp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-html-warn-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });
    const interactionDir = join(courseDir, "interactions", "bad-api");
    await mkdir(interactionDir, { recursive: true });
    await writeFile(
      join(interactionDir, "index.html"),
      `<script>window.lxpack?.track({ type: "interaction", id: "x" });</script>`,
    );
    const lesson = {
      id: "bad_lab",
      type: "html" as const,
      path: "interactions/bad-api",
    };
    const issues = await validateHtmlLesson(courseDir, lesson);
    expect(
      issues.some(
        (i) =>
          i.severity === "warning" && i.message.includes("window.parent.lxpack"),
      ),
    ).toBe(true);
    await rm(courseDir, { recursive: true, force: true });
  });
});
