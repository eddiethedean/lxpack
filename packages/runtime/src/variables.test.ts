import { describe, expect, it } from "vitest";
import {
  initManifestVariables,
  manifestVariableKey,
  readManifestVariable,
  writeManifestVariable,
} from "./variables.js";

describe("manifest variables", () => {
  it("prefixes keys and round-trips values", () => {
    expect(manifestVariableKey("path")).toBe("v:path");
    const suspend: Record<string, unknown> = {};
    initManifestVariables(
      {
        title: "T",
        version: "1",
        lessons: [],
        variables: { path: { default: "intro", type: "string" } },
      },
      suspend,
    );
    expect(suspend["v:path"]).toBe("intro");
    writeManifestVariable(suspend, "path", "advanced");
    expect(readManifestVariable(suspend, "path")).toBe("advanced");
  });

  it("does not overwrite existing suspend values", () => {
    const suspend = { "v:path": "saved" };
    initManifestVariables(
      {
        title: "T",
        version: "1",
        lessons: [],
        variables: { path: { default: "intro", type: "string" } },
      },
      suspend,
    );
    expect(suspend["v:path"]).toBe("saved");
  });
});
