import { describe, expect, it, vi } from "vitest";
import { createAnalyticsReporter } from "./factory.js";
import { NoopReporter } from "./noop.js";
import { XapiReporter } from "./xapi-reporter.js";
import type { RuntimeConfig } from "../types.js";

const baseManifest = {
  title: "Test",
  version: "1.0.0",
  lessons: [{ id: "a", title: "A", type: "markdown" as const, file: "lessons/a.md" }],
};

describe("createAnalyticsReporter", () => {
  it("returns XapiReporter for xapi mode with activityIri", () => {
    const config: RuntimeConfig = {
      manifest: baseManifest,
      baseUrl: ".",
      mode: "xapi",
      activityIri: "https://example.test/courses/test",
    };
    const reporter = createAnalyticsReporter(config);
    expect(reporter).not.toBeInstanceOf(NoopReporter);
    expect(reporter).toHaveProperty("onLaunched");
  });

  it("returns NoopReporter for scorm12 without xapi tracking", () => {
    const config: RuntimeConfig = {
      manifest: baseManifest,
      baseUrl: ".",
      mode: "scorm12",
    };
    expect(createAnalyticsReporter(config)).toBeInstanceOf(NoopReporter);
  });

  it("invokes onStatement once per event in preview with previewLog", async () => {
    const onStatement = vi.fn();
    const config: RuntimeConfig = {
      manifest: {
        ...baseManifest,
        tracking: {
          xapi: { activityIri: "https://example.test/courses/test" },
        },
      },
      baseUrl: "/course",
      mode: "preview",
      activityIri: "https://example.test/courses/test",
      xapi: { previewLog: true, mockLrs: true },
    };

    const original = console.debug;
    console.debug = vi.fn();

    const reporter = createAnalyticsReporter(config);
    expect(reporter).not.toBeInstanceOf(NoopReporter);

    reporter.onLaunched();
    expect(onStatement).not.toHaveBeenCalled();

    const xapiReporter = new XapiReporter(
      config.manifest,
      config.activityIri!,
      { mockLrs: true, onStatement },
    );
    xapiReporter.onLaunched();
    await vi.waitFor(() => expect(onStatement).toHaveBeenCalledTimes(1));

    console.debug = original;
  });
});
