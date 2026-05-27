import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadLessonKitInterchange,
  validateCourseWithInterchange,
} from "./interchange.js";
import { fixturePath } from "../../../test/helpers/paths.js";

describe("interchange", () => {
  it("returns missing when no interchange file exists", async () => {
    const result = await loadLessonKitInterchange(fixturePath("minimal-valid"));
    expect(result.status).toBe("missing");
  });

  it("returns error for malformed lessonkit.json", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ix-bad-"));
    await writeFile(join(courseDir, "lessonkit.json"), "{ not json");

    const result = await loadLessonKitInterchange(courseDir);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.fileName).toBe("lessonkit.json");
      expect(result.issues[0]?.message).toContain("Invalid JSON");
    }

    const validation = await validateCourseWithInterchange(courseDir);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some((i) => i.path === "lessonkit.json")).toBe(
      true,
    );
  });
});
