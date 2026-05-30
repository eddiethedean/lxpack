import { mkdir, mkdtemp, writeFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import {
  validateInteractionTree,
  validateUnexpectedCourseFiles,
} from "./course-extras.js";
import type { CourseManifest } from "../schemas.js";

const manifest: CourseManifest = {
  title: "T",
  version: "1.0.0",
  lessons: [{ id: "a", type: "markdown", file: "lessons/a.md" }],
};

describe("validateUnexpectedCourseFiles", () => {
  it("warns on sensitive dotfiles at course root", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-extras-"));
    await writeFile(join(dir, "course.yaml"), "title: T\nversion: 1.0.0\n");
    await writeFile(join(dir, ".env"), "SECRET=1\n");

    const issues = await validateUnexpectedCourseFiles(dir, manifest);
    expect(issues.some((i) => i.path === ".env" && i.severity === "warning")).toBe(
      true,
    );
  });

  it("warns on unexpected loose files at course root", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-extras-file-"));
    await writeFile(join(dir, "notes.txt"), "draft");

    const issues = await validateUnexpectedCourseFiles(dir, manifest);
    expect(issues.some((i) => i.path === "notes.txt")).toBe(true);
  });

  it("ignores known top-level entries", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-extras-known-"));
    await mkdir(join(dir, "lessons"), { recursive: true });
    await writeFile(join(dir, "package.json"), "{}");

    const issues = await validateUnexpectedCourseFiles(dir, manifest);
    expect(issues).toHaveLength(0);
  });

  it("ignores lessonkit interchange metadata at course root", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-extras-lk-"));
    await writeFile(join(dir, "lessonkit.json"), '{"format":"lessonkit"}');
    await writeFile(join(dir, "lxpack.import.json"), "{}");

    const issues = await validateUnexpectedCourseFiles(dir, manifest);
    expect(issues).toHaveLength(0);
  });
});

describe("validateInteractionTree", () => {
  it("rejects symlinks under interaction directories", async () => {
    const outside = await mkdtemp(join(tmpdir(), "lxpack-extras-out-"));
    const course = await mkdtemp(join(tmpdir(), "lxpack-extras-course-"));
    await writeFile(join(outside, "secret.html"), "<p>x</p>");
    const interaction = join(course, "interactions", "lab");
    await mkdir(interaction, { recursive: true });
    await symlink(join(outside, "secret.html"), join(interaction, "leak.html"));

    const issues = await validateInteractionTree(
      course,
      interaction,
      "lessons.lab.path",
    );
    expect(issues.some((i) => i.message.includes("Symlink"))).toBe(true);
  });

  it("walks nested directories without issues when contained", async () => {
    const course = await mkdtemp(join(tmpdir(), "lxpack-extras-nested-"));
    const interaction = join(course, "interactions", "lab");
    await mkdir(join(interaction, "assets"), { recursive: true });
    await writeFile(join(interaction, "index.html"), "<html></html>");
    await writeFile(join(interaction, "assets", "a.js"), "// ok");

    const issues = await validateInteractionTree(
      course,
      interaction,
      "lessons.lab.path",
    );
    expect(issues).toHaveLength(0);
  });
});
