import { describe, expect, it } from "vitest";
import { resolveExportTarget } from "./resolve-export-target.js";

describe("resolveExportTarget", () => {
  it("prefers CLI target over config default", () => {
    expect(
      resolveExportTarget("scorm12", {
        exports: { defaultTarget: "xapi" },
      }),
    ).toBe("scorm12");
  });

  it("uses config default when CLI target omitted", () => {
    expect(
      resolveExportTarget(undefined, {
        exports: { defaultTarget: "scorm2004" },
      }),
    ).toBe("scorm2004");
  });

  it("defaults to scorm12 when neither CLI target nor config default is set", () => {
    expect(resolveExportTarget(undefined, null)).toBe("scorm12");
  });
});
