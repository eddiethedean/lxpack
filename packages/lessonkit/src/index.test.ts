import { describe, expect, it } from "vitest";
import {
  getLxpackBridge,
  packageLessonkit,
  parseLessonkitInterchange,
  mapLessonkitTelemetryToLxpack,
} from "./index.js";

describe("@lxpack/lessonkit re-exports", () => {
  it("exports core APIs", () => {
    expect(typeof packageLessonkit).toBe("function");
    expect(typeof parseLessonkitInterchange).toBe("function");
    expect(typeof getLxpackBridge).toBe("function");
    expect(
      mapLessonkitTelemetryToLxpack({
        name: "interaction",
        lessonId: "a",
      }),
    ).toBeTruthy();
  });
});
