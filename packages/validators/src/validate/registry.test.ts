import { describe, expect, it } from "vitest";
import type { LessonValidator } from "./registry.js";
import { getLessonValidator, registerLessonValidator } from "./registry.js";

describe("lesson validator registry", () => {
  it("allows registering and retrieving a validator by type", () => {
    const validator: LessonValidator = () => [
      { path: "x", message: "y", severity: "warning" },
    ];
    registerLessonValidator("custom", validator);
    expect(getLessonValidator("custom")).toBe(validator);
  });
});

