import { describe, it, expect, vi, afterEach } from "vitest";
import {
  Scorm2004Adapter,
  Scorm2004Simulator,
  createScorm2004Connection,
  findScorm2004Api,
  installScorm2004API,
} from "./scorm2004-api.js";
import { SCORM_SUSPEND_DATA_MAX } from "./progress/constants.js";

const PREVIEW_STORAGE_KEY = "lxpack_scorm2004_preview";

describe("Scorm2004Simulator", () => {
  afterEach(() => {
    localStorage.removeItem(PREVIEW_STORAGE_KEY);
  });

  it("requires Initialize before get/set", () => {
    const api = new Scorm2004Simulator();
    expect(api.GetValue("cmi.location")).toBe("");
    expect(api.Initialize()).toBe("true");
    expect(api.GetValue("cmi.completion_status")).toBe("unknown");
  });

  it("reads and writes SCORM 2004 elements", () => {
    const api = new Scorm2004Simulator();
    api.Initialize();
    expect(api.SetValue("cmi.location", "intro")).toBe("true");
    expect(api.GetValue("cmi.location")).toBe("intro");
    api.setScoreScaled(0.85);
    expect(api.GetValue("cmi.score.scaled")).toBe("0.85");
  });

  it("persists preview state to localStorage", () => {
    const api1 = new Scorm2004Simulator({ persistToStorage: true });
    api1.Initialize();
    api1.setSuspendData('{"ok":true}');
    api1.Terminate();

    const api2 = new Scorm2004Simulator({ persistToStorage: true });
    api2.Initialize();
    expect(api2.GetValue("cmi.suspend_data")).toBe('{"ok":true}');
  });

  it("rejects double initialize and access after terminate", () => {
    const api = new Scorm2004Simulator();
    expect(api.Initialize()).toBe("true");
    expect(api.Initialize()).toBe("false");
    expect(api.Terminate()).toBe("true");
    expect(api.GetValue("cmi.location")).toBe("");
    expect(api.SetValue("cmi.location", "x")).toBe("false");
    expect(api.Commit()).toBe("false");
  });

  it("loads corrupt localStorage without throwing", () => {
    localStorage.setItem(PREVIEW_STORAGE_KEY, "not-json");
    const api = new Scorm2004Simulator({ persistToStorage: true });
    api.Initialize();
    expect(api.GetValue("cmi.completion_status")).toBe("unknown");
  });

  it("returns diagnostic helpers", () => {
    const api = new Scorm2004Simulator();
    expect(api.GetLastError()).toBe("0");
    expect(api.GetErrorString()).toBe("No error");
    expect(api.GetDiagnostic()).toBe("");
  });

  it("trims suspend_data to SCORM limit on set", () => {
    const api = new Scorm2004Simulator();
    api.Initialize();
    const long = "x".repeat(SCORM_SUSPEND_DATA_MAX + 500);
    api.setSuspendData(long);
    expect(api.GetValue("cmi.suspend_data").length).toBeLessThanOrEqual(
      SCORM_SUSPEND_DATA_MAX,
    );
    api.SetValue("cmi.suspend_data", long);
    expect(api.GetValue("cmi.suspend_data").length).toBeLessThanOrEqual(
      SCORM_SUSPEND_DATA_MAX,
    );
  });
});

describe("Scorm2004Adapter", () => {
  it("delegates to the underlying API", () => {
    const inner: Scorm2004Simulator = new Scorm2004Simulator();
    inner.Initialize();
    const adapter = new Scorm2004Adapter(inner);
    adapter.setLocation("lesson-1");
    expect(adapter.GetValue("cmi.location")).toBe("lesson-1");
    adapter.setCompletionStatus("completed");
    adapter.setSuccessStatus("passed");
    expect(adapter.GetValue("cmi.completion_status")).toBe("completed");
    expect(adapter.Commit()).toBe("true");
    expect(adapter.Terminate()).toBe("true");
  });
});

describe("findScorm2004Api", () => {
  it("finds API_1484_11 on window", () => {
    const api = new Scorm2004Simulator();
    (window as Window & { API_1484_11?: typeof api }).API_1484_11 = api;
    expect(findScorm2004Api()).toBe(api);
    delete (window as Window & { API_1484_11?: typeof api }).API_1484_11;
  });

  it("returns null when no API is present", () => {
    expect(findScorm2004Api()).toBeNull();
  });
});

describe("installScorm2004API", () => {
  afterEach(() => {
    delete (window as Window & { API_1484_11?: unknown }).API_1484_11;
  });

  it("exposes API_1484_11 on window in preview mode", () => {
    const conn = installScorm2004API("preview");
    expect(
      (window as Window & { API_1484_11?: typeof conn }).API_1484_11,
    ).toBe(conn);
  });
});

describe("createScorm2004Connection", () => {
  it("uses preview simulator with storage", () => {
    const conn = createScorm2004Connection("preview");
    expect(conn).toBeInstanceOf(Scorm2004Simulator);
    conn.Initialize();
    expect(conn.GetValue("cmi.entry")).toBe("ab-initio");
  });

  it("falls back to in-memory simulator when LMS API is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const conn = createScorm2004Connection("scorm2004");
    expect(conn).toBeInstanceOf(Scorm2004Simulator);
    warn.mockRestore();
  });

  it("wraps LMS API when present", () => {
    const api = new Scorm2004Simulator();
    (window as Window & { API_1484_11?: typeof api }).API_1484_11 = api;
    const conn = createScorm2004Connection("scorm2004");
    expect(conn).toBeInstanceOf(Scorm2004Adapter);
    delete (window as Window & { API_1484_11?: typeof api }).API_1484_11;
  });
});
