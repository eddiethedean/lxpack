import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bootstrapCmi5LaunchParams,
  Cmi5FetchError,
  fetchCmi5AuthToken,
  mergeLaunchWithCmi5Fetch,
  readCachedCmi5AuthToken,
  writeCachedCmi5AuthToken,
} from "./cmi5-fetch.js";

describe("fetchCmi5AuthToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("POSTs to the fetch URL and returns auth-token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ "auth-token": "abc123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const token = await fetchCmi5AuthToken("https://lms.example/cmi5/fetch/1");
    expect(token).toBe("abc123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://lms.example/cmi5/fetch/1",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("reads cached token without a second POST", async () => {
    writeCachedCmi5AuthToken("https://lms.example/cmi5/fetch/2", "cached");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const token = await fetchCmi5AuthToken("https://lms.example/cmi5/fetch/2");
    expect(token).toBe("cached");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on LMS error payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({
          "error-code": "403",
          "error-text": "Already used",
        }),
      }),
    );

    await expect(
      fetchCmi5AuthToken("https://lms.example/cmi5/fetch/3"),
    ).rejects.toThrow(Cmi5FetchError);
  });
});

describe("bootstrapCmi5LaunchParams", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("merges auth from fetch when launch has no auth", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ "auth-token": "from-fetch" }),
      }),
    );

    const merged = await bootstrapCmi5LaunchParams({
      endpoint: "https://lrs.example/xapi/",
      fetch: "https://lms.example/cmi5/fetch/4",
    });
    expect(merged.auth).toBe("from-fetch");
    expect(merged.endpoint).toBe("https://lrs.example/xapi/");
  });

  it("keeps launch auth when already present", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const merged = await bootstrapCmi5LaunchParams({
      endpoint: "https://lrs.example/xapi/",
      auth: "existing",
      fetch: "https://lms.example/cmi5/fetch/5",
    });
    expect(merged.auth).toBe("existing");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("mergeLaunchWithCmi5Fetch", () => {
  it("does not override existing auth", () => {
    expect(
      mergeLaunchWithCmi5Fetch(
        { auth: "keep", endpoint: "https://lrs.example/" },
        "new",
      ).auth,
    ).toBe("keep");
  });
});

describe("readCachedCmi5AuthToken", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("returns undefined when not cached", () => {
    expect(readCachedCmi5AuthToken("https://lms.example/none")).toBeUndefined();
  });
});
