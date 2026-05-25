import { describe, expect, it } from "vitest";
import { parseLaunchParams } from "./launch.js";

describe("parseLaunchParams", () => {
  it("parses cmi5-style query string with endpoint", () => {
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

  it("does not treat fetch as LRS endpoint", () => {
    const params = parseLaunchParams(
      "?fetch=https://lms.example/cmi5/fetch/session-abc",
    );
    expect(params.endpoint).toBeUndefined();
    expect(params.fetch).toBe("https://lms.example/cmi5/fetch/session-abc");
  });

  it("prefers endpoint when both endpoint and fetch are present", () => {
    const params = parseLaunchParams(
      "?endpoint=https://lrs.example/xapi/&fetch=https://lms.example/fetch/xyz",
    );
    expect(params.endpoint).toBe("https://lrs.example/xapi/");
    expect(params.fetch).toBe("https://lms.example/fetch/xyz");
  });

  it("merges query and hash with hash overriding duplicate keys", () => {
    const params = parseLaunchParams(
      "?endpoint=https://lrs.example/search",
      "#endpoint=https://lrs.example/hash",
    );
    expect(params.endpoint).toBe("https://lrs.example/hash");
  });

  it("reads actor from hash when search has other params", () => {
    const actor = encodeURIComponent(
      JSON.stringify({ name: "Hash Actor", mbox: "mailto:h@x.com" }),
    );
    const params = parseLaunchParams("?registration=r1", `#actor=${actor}`);
    expect(params.registration).toBe("r1");
    expect(params.actor?.name).toBe("Hash Actor");
  });
});
