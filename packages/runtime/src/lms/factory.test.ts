import { afterEach, describe, expect, it } from "vitest";
import { createLmsBridge } from "./factory.js";
import { LocalBridge } from "./local-bridge.js";
import { Scorm12Bridge } from "./scorm12-bridge.js";
import { Scorm2004Bridge } from "./scorm2004-bridge.js";

describe("createLmsBridge", () => {
  afterEach(() => {
    const win = window as Window & {
      API?: unknown;
      API_1484_11?: unknown;
    };
    delete win.API;
    delete win.API_1484_11;
  });

  it("uses LocalBridge for preview local mode", () => {
    const bridge = createLmsBridge("preview", "lxpack_progress_test", "local");
    expect(bridge).toBeInstanceOf(LocalBridge);
  });

  it("uses Scorm12Bridge and exposes API for preview scorm12", () => {
    const bridge = createLmsBridge("preview", "lxpack_progress_test", "scorm12");
    expect(bridge).toBeInstanceOf(Scorm12Bridge);
    expect((window as Window & { API?: unknown }).API).toBeDefined();
  });

  it("uses Scorm2004Bridge and exposes API_1484_11 for preview scorm2004", () => {
    const bridge = createLmsBridge(
      "preview",
      "lxpack_progress_test",
      "scorm2004",
    );
    expect(bridge).toBeInstanceOf(Scorm2004Bridge);
    expect(
      (window as Window & { API_1484_11?: unknown }).API_1484_11,
    ).toBeDefined();
  });
});
