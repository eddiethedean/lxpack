import { describe, expect, it } from "vitest";
import { getDirPackager, getZipPackager } from "./index.js";

describe("packagers", () => {
  it("returns a zip packager for each target", () => {
    expect(getZipPackager("scorm12").package).toBeTypeOf("function");
    expect(getZipPackager("standalone").package).toBeTypeOf("function");
    expect(getZipPackager("xapi").package).toBeTypeOf("function");
  });

  it("returns a dir packager for each target", () => {
    expect(getDirPackager("scorm12").package).toBeTypeOf("function");
    expect(getDirPackager("scorm2004").package).toBeTypeOf("function");
    expect(getDirPackager("cmi5").package).toBeTypeOf("function");
  });
});

