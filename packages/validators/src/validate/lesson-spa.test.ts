import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateSpaLesson, warnDirectLxpackApiInSpaHtml } from "./lesson-spa.js";
import { fixturePath } from "../../../../test/helpers/paths.js";
import { loadManifest } from "../validate.js";

describe("warnDirectLxpackApiInSpaHtml", () => {
  it("warns when index.html uses window.lxpack without parent", () => {
    const issue = warnDirectLxpackApiInSpaHtml(
      'window.lxpack?.track({ type: "interaction" });',
      "lessons.lab.path",
    );
    expect(issue?.severity).toBe("warning");
    expect(issue?.message).toContain("window.parent.lxpackBridge.v1");
  });

  it("does not warn when parent.lxpackBridge is used", () => {
    expect(
      warnDirectLxpackApiInSpaHtml(
        "window.parent.lxpackBridge.v1.track({ type: 'interaction' });",
        "lessons.lab.path",
      ),
    ).toBeNull();
  });

  it("does not warn when parent.lxpack is used", () => {
    expect(
      warnDirectLxpackApiInSpaHtml(
        "window.parent.lxpack.track({});",
        "lessons.lab.path",
      ),
    ).toBeNull();
  });

  it("warns on lxpack.submitAssessment without parent", () => {
    const issue = warnDirectLxpackApiInSpaHtml(
      "lxpack.submitAssessment({ id: 'q' });",
      "lessons.lab.path",
    );
    expect(issue?.severity).toBe("warning");
  });

  it("returns null when no lxpack API is referenced", () => {
    expect(warnDirectLxpackApiInSpaHtml("<html></html>", "p")).toBeNull();
  });
});

describe("validateSpaLesson", () => {
  it("validates existing spa directory", async () => {
    const loaded = await loadManifest(fixturePath("spa-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const manifest = loaded.manifest;
    const lesson = manifest.lessons.find((l) => l.type === "spa");
    if (!lesson || lesson.type !== "spa") {
      throw new Error("fixture missing spa lesson");
    }
    const issues = await validateSpaLesson(fixturePath("spa-valid"), lesson);
    expect(issues).toHaveLength(0);
  });

  it("errors when spa path is unsafe", async () => {
    const issues = await validateSpaLesson(fixturePath("spa-valid"), {
      id: "bad_spa",
      type: "spa" as const,
      path: "dist/../escape",
    });
    expect(issues.some((i) => i.severity === "error")).toBe(true);
  });

  it("errors when spa directory is missing", async () => {
    const issues = await validateSpaLesson(fixturePath("spa-valid"), {
      id: "missing_spa",
      type: "spa" as const,
      path: "spa/lessons/does-not-exist",
    });
    expect(issues.some((i) => i.severity === "error")).toBe(true);
  });

  it("errors when spa index.html is missing", async () => {
    const { mkdtemp, mkdir, cp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-spa-missing-index-"));
    await cp(fixturePath("spa-valid"), courseDir, { recursive: true });
    await mkdir(join(courseDir, "spa", "lessons", "no-index"), { recursive: true });

    const issues = await validateSpaLesson(courseDir, {
      id: "no_index",
      type: "spa" as const,
      path: "spa/lessons/no-index",
    });
    expect(issues.some((i) => i.severity === "error")).toBe(true);
    await rm(courseDir, { recursive: true, force: true });
  });

  it("errors when spa path is a file not a directory", async () => {
    const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-spa-file-"));
    await writeFile(join(courseDir, "not-a-dir"), "not a directory");

    const issues = await validateSpaLesson(courseDir, {
      id: "file_spa",
      type: "spa" as const,
      path: "not-a-dir",
    });
    expect(issues.some((i) => i.message.includes("not a directory"))).toBe(
      true,
    );
    await rm(courseDir, { recursive: true, force: true });
  });

  it("warns when spa index.html calls window.lxpack directly", async () => {
    const { mkdtemp, writeFile, cp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-spa-warn-"));
    await cp(fixturePath("spa-valid"), courseDir, { recursive: true });
    const spaDir = join(courseDir, "dist", "lessons", "bad-api");
    await mkdir(spaDir, { recursive: true });
    await writeFile(
      join(spaDir, "index.html"),
      `<script>window.lxpack?.track({ type: "interaction", id: "x" });</script>`,
    );
    const lesson = {
      id: "bad_spa",
      type: "spa" as const,
      path: "dist/lessons/bad-api",
    };
    const issues = await validateSpaLesson(courseDir, lesson);
    expect(
      issues.some(
        (i) =>
          i.severity === "warning" &&
          i.message.includes("window.parent.lxpackBridge.v1"),
      ),
    ).toBe(true);
    await rm(courseDir, { recursive: true, force: true });
  });
});

