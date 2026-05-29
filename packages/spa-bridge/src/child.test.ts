import { describe, expect, it } from "vitest";
import { createLxpackBridgeHost } from "./host.js";
import { getLxpackBridge, supportedBridgeVersions } from "./child.js";

describe("getLxpackBridge", () => {
  it("reads v1 from parent window", () => {
    const parent = {
      lxpackBridge: createLxpackBridgeHost({
        completeLesson: () => {},
        completeCourse: () => {},
        submitAssessment: () => {},
        track: () => {},
      }),
    } as unknown as Window;
    expect(getLxpackBridge(parent)).toBe(parent.lxpackBridge!.v1);
  });

  it("returns null when bridge missing", () => {
    expect(getLxpackBridge({} as Window)).toBeNull();
  });

  it("lists supported versions", () => {
    expect(supportedBridgeVersions()).toContain("v1");
  });
});
