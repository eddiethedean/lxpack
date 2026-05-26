import { afterEach, describe, expect, it, vi } from "vitest";
import { XapiReporter } from "./xapi-reporter.js";

const manifest = {
  title: "Test",
  version: "1.0.0",
  lessons: [{ id: "intro", title: "Intro", type: "markdown" as const, file: "lessons/intro.md" }],
};

describe("XapiReporter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("bootstraps auth from cmi5 fetch URL", async () => {
    const onStatement = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ "auth-token": "token-from-fetch" }),
      }),
    );

    const reporter = new XapiReporter(manifest, "https://example.test/courses/t", {
      mockLrs: false,
      onStatement,
      launchParams: {
        endpoint: "https://lrs.example/xapi/",
        fetch: "https://lms.example/cmi5/fetch/session",
      },
    });

    reporter.onLaunched();
    await vi.waitFor(() => expect(onStatement).toHaveBeenCalled());
    expect(onStatement.mock.calls[0]?.[0]?.verb.id).toContain("launched");
  });

  it("skips statements for unknown activity ids", async () => {
    const onStatement = vi.fn();
    const reporter = new XapiReporter(manifest, "https://example.test/courses/t", {
      mockLrs: true,
      onStatement,
      launchParams: { endpoint: "https://lrs.example/xapi/" },
    });

    reporter.onExperienced("missing-lesson");
    await new Promise((r) => setTimeout(r, 10));
    expect(onStatement).not.toHaveBeenCalled();
  });
});
