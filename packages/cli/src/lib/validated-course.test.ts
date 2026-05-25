import { describe, expect, it } from "vitest";
import { fixturePath } from "../../../../test/helpers/paths.js";
import { loadValidatedCourseContext } from "./validated-course.js";

describe("loadValidatedCourseContext", () => {
  it("returns null when validation fails", async () => {
    const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const dir = await mkdtemp(join(tmpdir(), "lxpack-ctx-invalid-"));
    await writeFile(join(dir, "course.yaml"), "title: [\n");
    expect(await loadValidatedCourseContext(dir)).toBeNull();
    await rm(dir, { recursive: true, force: true });
  });

  it("loads xapi-valid with export target", async () => {
    const ctx = await loadValidatedCourseContext(fixturePath("xapi-valid"), {
      exportTarget: "xapi",
    });
    expect(ctx?.manifest.tracking?.xapi?.activityIri).toContain("https://");
  });
});
