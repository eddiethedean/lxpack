import { describe, expect, it } from "vitest";
import { isPreviewBlockedCoursePath } from "./preview-paths.js";

describe("isPreviewBlockedCoursePath", () => {
  it("blocks assessments, manifest, config, and build output", () => {
    expect(isPreviewBlockedCoursePath("/course/assessments/q.yaml")).toBe(true);
    expect(isPreviewBlockedCoursePath("/course/course.yaml")).toBe(true);
    expect(isPreviewBlockedCoursePath("/course/lxpack.config.json")).toBe(true);
    expect(isPreviewBlockedCoursePath("/course/.lxpack/out.zip")).toBe(true);
  });

  it("allows normal course assets", () => {
    expect(isPreviewBlockedCoursePath("/course/lessons/intro.md")).toBe(false);
    expect(isPreviewBlockedCoursePath("/runtime/client.js")).toBe(false);
  });
});
