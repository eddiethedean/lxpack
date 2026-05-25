import { describe, expect, it } from "vitest";
import { parseLaunchParams } from "./launch.js";

describe("parseLaunchParams", () => {
  it("parses cmi5-style query string", () => {
    const actor = encodeURIComponent(
      JSON.stringify({ name: "Jane", mbox: "mailto:j@x.com" }),
    );
    const params = parseLaunchParams(
      `?endpoint=https://lrs.example/xapi/&auth=token&registration=r1&activityId=https://course&id&actor=${actor}`,
    );
    expect(params.endpoint).toBe("https://lrs.example/xapi/");
    expect(params.auth).toBe("token");
    expect(params.registration).toBe("r1");
    expect(params.actor?.name).toBe("Jane");
  });
});
