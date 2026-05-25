import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  isPreviewBlockedCoursePath,
  isPreviewBlockedCourseRel,
  isPreviewCoursePathEscaping,
  normalizeCourseRelPath,
  shouldBlockPreviewCourseRequest,
} from "./preview-paths.js";

describe("normalizeCourseRelPath", () => {
  it("returns null for URLs outside /course/", () => {
    expect(normalizeCourseRelPath("/runtime/client.js")).toBeNull();
  });

  it("rejects path traversal", () => {
    expect(normalizeCourseRelPath("/course/lessons/../../course.yaml")).toBe(
      null,
    );
  });

  it("normalizes duplicate slashes and dot segments", () => {
    expect(normalizeCourseRelPath("/course/foo/../bar.md")).toBe("bar.md");
    expect(normalizeCourseRelPath("/course//lessons/intro.md")).toBe(
      "lessons/intro.md",
    );
  });
});

describe("isPreviewBlockedCoursePath", () => {
  it("blocks assessments, manifest, config, and build output", () => {
    expect(isPreviewBlockedCoursePath("/course/assessments/q.yaml")).toBe(true);
    expect(isPreviewBlockedCoursePath("/course/course.yaml")).toBe(true);
    expect(isPreviewBlockedCoursePath("/course/lxpack.config.json")).toBe(true);
    expect(isPreviewBlockedCoursePath("/course/lxpack.config.ts")).toBe(true);
    expect(isPreviewBlockedCoursePath("/course/.lxpack/out.zip")).toBe(true);
  });

  it("blocks traversal bypass URLs for sensitive files", () => {
    expect(
      isPreviewBlockedCoursePath("/course/lessons/../../course.yaml"),
    ).toBe(true);
    expect(
      isPreviewBlockedCoursePath("/course/foo/../lxpack.config.json"),
    ).toBe(true);
    expect(
      isPreviewBlockedCoursePath("/course/lessons/../../assessments/q.yaml"),
    ).toBe(true);
    expect(
      isPreviewBlockedCoursePath("/course/out/../../.lxpack/pkg.zip"),
    ).toBe(true);
  });

  it("blocks dotfiles under course", () => {
    expect(isPreviewBlockedCoursePath("/course/.env")).toBe(true);
    expect(isPreviewBlockedCoursePath("/course/.git/HEAD")).toBe(true);
  });

  it("allows normal course assets", () => {
    expect(isPreviewBlockedCoursePath("/course/lessons/intro.md")).toBe(false);
    expect(isPreviewBlockedCoursePath("/runtime/client.js")).toBe(false);
  });
});

describe("isPreviewBlockedCourseRel", () => {
  it("blocks lxpack.config.ts", () => {
    expect(isPreviewBlockedCourseRel("lxpack.config.ts")).toBe(true);
  });

  it("blocks .lxpack at course root", () => {
    expect(isPreviewBlockedCourseRel(".lxpack")).toBe(true);
    expect(isPreviewBlockedCourseRel(".lxpack/build.zip")).toBe(true);
  });
});

describe("shouldBlockPreviewCourseRequest", () => {
  it("blocks symlink escape targets", async () => {
    const outside = await mkdtemp(join(tmpdir(), "lxpack-preview-out-"));
    const course = await mkdtemp(join(tmpdir(), "lxpack-preview-course-"));
    await writeFile(join(outside, "secret.txt"), "secret");
    await mkdir(join(course, "assets"), { recursive: true });
    await symlink(join(outside, "secret.txt"), join(course, "assets", "leak.txt"));

    expect(
      shouldBlockPreviewCourseRequest(
        course,
        "/course/assets/leak.txt",
      ),
    ).toBe(true);
  });
});

describe("isPreviewCoursePathEscaping", () => {
  it("flags traversal URLs", async () => {
    const course = await mkdtemp(join(tmpdir(), "lxpack-preview-esc-"));
    await writeFile(join(course, "course.yaml"), "title: T\nversion: 1.0.0\n");
    expect(
      isPreviewCoursePathEscaping(
        course,
        "/course/lessons/../../course.yaml",
      ),
    ).toBe(true);
  });

  it("allows /course/ root without escape", async () => {
    const course = await mkdtemp(join(tmpdir(), "lxpack-preview-root-"));
    expect(isPreviewCoursePathEscaping(course, "/course/")).toBe(false);
    expect(isPreviewBlockedCoursePath("/course/")).toBe(false);
  });

  it("ignores non-course URLs", () => {
    expect(isPreviewCoursePathEscaping("/tmp", "/")).toBe(false);
    expect(isPreviewBlockedCoursePath("/")).toBe(false);
  });
});

describe("shouldBlockPreviewCourseRequest", () => {
  it("blocks blocked paths without escape check", async () => {
    const course = await mkdtemp(join(tmpdir(), "lxpack-preview-block-"));
    expect(shouldBlockPreviewCourseRequest(course, "/course/course.yaml")).toBe(
      true,
    );
  });
});
