import { describe, expect, it } from "vitest";
import { getCourseActivityIri, validateXapiTracking } from "./xapi-validate.js";
import type { CourseManifest } from "./schemas.js";

const base: CourseManifest = {
  title: "T",
  version: "1.0.0",
  lessons: [{ id: "a", type: "markdown", file: "lessons/a.md" }],
};

describe("validateXapiTracking", () => {
  it("requires tracking.xapi", () => {
    const issues = validateXapiTracking(base);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("tracking.xapi");
  });

  it("rejects non-https activityIri", () => {
    const issues = validateXapiTracking({
      ...base,
      tracking: {
        xapi: { activityIri: "http://example.test/course" },
      },
    });
    expect(issues[0]?.message).toContain("https");
  });

  it("rejects invalid URL", () => {
    const issues = validateXapiTracking({
      ...base,
      tracking: {
        xapi: { activityIri: "not-a-url" },
      },
    });
    expect(issues[0]?.message).toContain("valid URL");
  });

  it("passes for https activityIri", () => {
    const issues = validateXapiTracking({
      ...base,
      tracking: {
        xapi: { activityIri: "https://example.test/courses/demo" },
      },
    });
    expect(issues).toHaveLength(0);
  });
});

describe("getCourseActivityIri", () => {
  it("returns activityIri when set", () => {
    expect(
      getCourseActivityIri({
        ...base,
        tracking: { xapi: { activityIri: "https://example.test/c" } },
      }),
    ).toBe("https://example.test/c");
  });
});
