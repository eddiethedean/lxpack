import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, writeFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  coursePathEscapesRoot,
  decodeCourseUrlPath,
  isPreviewBlockedCoursePath,
  isPreviewBlockedCourseRel,
  isPreviewCoursePathEscaping,
  normalizeCourseRelPath,
  shouldBlockPreviewCourseRequest,
} from "./preview-paths.js";

describe("decodeCourseUrlPath", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when decodeURIComponent throws", () => {
    vi.spyOn(globalThis, "decodeURIComponent").mockImplementation(() => {
      throw new URIError("bad");
    });
    expect(decodeCourseUrlPath("%41%42")).toBeNull();
  });

  it("returns input when decode is a no-op", () => {
    vi.spyOn(globalThis, "decodeURIComponent").mockReturnValue("noop%41");
    expect(decodeCourseUrlPath("noop%41")).toBe("noop%41");
  });
});

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

  it("rejects percent-encoded path traversal", () => {
    expect(normalizeCourseRelPath("/course/%2e%2e%2fcourse.yaml")).toBeNull();
    expect(
      isPreviewBlockedCoursePath("/course/lessons/%2e%2e/course.yaml"),
    ).toBe(true);
  });

  it("decodes encoded slashes before normalization", () => {
    expect(normalizeCourseRelPath("/course/lessons%2fintro.md")).toBe(
      "lessons/intro.md",
    );
  });

  it("rejects double-encoded traversal", () => {
    expect(normalizeCourseRelPath("/course/%252e%252e%252fassessments/q.yaml")).toBeNull();
  });

  it("rejects malformed percent sequences", () => {
    expect(normalizeCourseRelPath("/course/lessons/%")).toBeNull();
  });

  it("rejects null bytes in decoded paths", () => {
    expect(normalizeCourseRelPath("/course/%00/intro.md")).toBeNull();
  });

  it("rejects normalized .. at course root", () => {
    expect(normalizeCourseRelPath("/course/..")).toBeNull();
    expect(normalizeCourseRelPath("/course/../secret")).toBeNull();
  });
});

describe("coursePathEscapesRoot", () => {
  it("detects parent escape above course root", () => {
    expect(coursePathEscapesRoot("../secret")).toBe(true);
    expect(coursePathEscapesRoot("lessons/../..")).toBe(true);
  });

  it("allows in-course relative segments", () => {
    expect(coursePathEscapesRoot("lessons/../intro.md")).toBe(false);
    expect(coursePathEscapesRoot("foo/bar.md")).toBe(false);
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

  it("blocks percent-encoded sensitive paths", () => {
    expect(isPreviewBlockedCoursePath("/course/%2e%2e%2fassessments/q.yaml")).toBe(
      true,
    );
    expect(isPreviewBlockedCoursePath("/course/%63ourse.yaml")).toBe(true);
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
