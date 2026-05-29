import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Scorm2004Adapter,
  Scorm2004Simulator,
  createScorm2004Connection,
  findScorm2004Api,
} from "./scorm2004-api.js";

const PREVIEW_STORAGE_KEY = "lxpack_scorm2004_preview";

describe("scorm2004-api branches", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    delete (window as Window & { API_1484_11?: Scorm2004Simulator }).API_1484_11;
  });

  it("loads persisted preview simulator state from localStorage", () => {
    localStorage.setItem(
      PREVIEW_STORAGE_KEY,
      JSON.stringify({ "cmi.location": "lesson-2" }),
    );
    const api = new Scorm2004Simulator({ persistToStorage: true });
    api.Initialize();
    expect(api.GetValue("cmi.location")).toBe("lesson-2");
  });

  it("swallows localStorage write failures", () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: () => {
          throw new Error("quota");
        },
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
      },
      configurable: true,
    });
    const api = new Scorm2004Simulator({ persistToStorage: true });
    api.Initialize();
    expect(api.SetValue("cmi.location", "x")).toBe("true");
  });

  it("continues when reading API on a frame throws", () => {
    const lms = new Scorm2004Simulator({ persistToStorage: false });
    Object.defineProperty(window, "API_1484_11", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    const parent = { API_1484_11: lms, parent: window } as unknown as Window;
    vi.spyOn(window, "parent", "get").mockReturnValue(parent);
    expect(findScorm2004Api()).toBe(lms);
  });

  it("finds APIs on parent windows when available", () => {
    const lms = new Scorm2004Simulator({ persistToStorage: false });
    const parent = { API_1484_11: lms } as unknown as Window;
    vi.spyOn(window, "parent", "get").mockReturnValue(parent);
    expect(findScorm2004Api()).toBe(lms);
  });

  it("finds APIs on opener windows when parent is unavailable", () => {
    const lms = new Scorm2004Simulator({ persistToStorage: false });
    const self = window as Window & { API_1484_11?: Scorm2004Simulator };
    const opener = { API_1484_11: lms, closed: false } as unknown as Window;
    vi.spyOn(window, "parent", "get").mockReturnValue(window);
    vi.spyOn(window, "opener", "get").mockReturnValue(opener);
    expect(findScorm2004Api()).toBe(lms);
    delete self.API_1484_11;
  });

  it("stops searching when opener is closed", () => {
    vi.spyOn(window, "parent", "get").mockReturnValue(window);
    vi.spyOn(window, "opener", "get").mockReturnValue({
      closed: true,
    } as Window);
    expect(findScorm2004Api()).toBeNull();
  });

  it("falls back when parent access throws", () => {
    vi.spyOn(window, "parent", "get").mockImplementation(() => {
      throw new Error("cross-origin");
    });
    expect(findScorm2004Api()).toBeNull();
  });

  it("uses preview connection in preview mode", () => {
    const conn = createScorm2004Connection("preview");
    conn.Initialize();
    conn.setLocation("intro");
    expect(conn.GetValue("cmi.location")).toBe("intro");
  });

  it("delegates before the wrapped API is initialized", () => {
    const inner = new Scorm2004Simulator({ persistToStorage: false });
    const adapter = new Scorm2004Adapter(inner);
    expect(adapter.Initialize()).toBe("true");
    expect(adapter.SetValue("cmi.location", "x")).toBe("true");
    expect(adapter.GetLastError()).toBe("0");
    expect(adapter.GetErrorString("301")).toBe("No error");
    expect(adapter.GetDiagnostic("301")).toBe("");
    expect(adapter.Terminate()).toBe("true");
    expect(adapter.SetValue("cmi.location", "y")).toBe("false");
    expect(adapter.GetValue("cmi.location")).toBe("");
  });

  it("adapter helpers set values on the wrapped API", () => {
    const inner = new Scorm2004Simulator({ persistToStorage: false });
    const adapter = new Scorm2004Adapter(inner);
    expect(adapter.Initialize()).toBe("true");
    adapter.setSuspendData("{}");
    adapter.setCompletionStatus("completed");
    adapter.setSuccessStatus("passed");
    adapter.setScoreScaled(1);
    expect(adapter.GetValue("cmi.suspend_data")).toBe("{}");
    expect(adapter.GetErrorString("1")).toBe("No error");
    expect(adapter.GetDiagnostic("1")).toBe("");
  });
});
