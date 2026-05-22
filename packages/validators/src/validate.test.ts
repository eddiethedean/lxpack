import { describe, it, expect } from "vitest";
import { courseManifestSchema } from "./schemas.js";

describe("courseManifestSchema", () => {
  it("accepts a valid manifest", () => {
    const result = courseManifestSchema.safeParse({
      title: "Test Course",
      version: "1.0.0",
      lessons: [
        { id: "intro", type: "markdown", file: "lessons/intro.md" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty lessons", () => {
    const result = courseManifestSchema.safeParse({
      title: "Test",
      version: "1.0.0",
      lessons: [],
    });
    expect(result.success).toBe(false);
  });
});
