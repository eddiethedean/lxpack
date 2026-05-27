import { describe, expect, it } from "vitest";
import { fixturePath } from "../../../test/helpers/paths.js";
import { validateCourse, buildCourse } from "./index.js";

describe("@lxpack/api", () => {
  it("validates a known-good fixture course", async () => {
    const result = await validateCourse({
      courseDir: fixturePath("minimal-valid"),
      target: "standalone",
    });
    expect(result.ok).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(result.manifest.title).toContain("Minimal");
  });

  it("builds a standalone directory for a temp course copy", async () => {
    const { mkdtemp, cp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");

    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-api-build-"));
    await cp(fixturePath("minimal-valid"), courseDir, { recursive: true });

    const result = await buildCourse({
      courseDir,
      target: "standalone",
      dir: true,
      output: "out",
      outputBaseDir: ".lxpack",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.outputDir).toContain("out");
      expect(result.fileCount).toBeGreaterThan(0);
    }

    await rm(courseDir, { recursive: true, force: true });
  });
});

