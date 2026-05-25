import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Scorm12Adapter,
  Scorm12Simulator,
  createScormConnection,
  findLmsApi,
  SCORM_SUSPEND_DATA_MAX,
  type ScormApiLike,
} from "./scorm-api.js";

const PREVIEW_STORAGE_KEY = "lxpack_scorm12_preview";

describe("scorm-api branches", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    delete (window as Window & { API?: ScormApiLike }).API;
  });

  it("loads persisted preview simulator state from localStorage", () => {
    localStorage.setItem(
      PREVIEW_STORAGE_KEY,
      JSON.stringify({ lessonStatus: "completed", scoreRaw: 80 }),
    );
    const api = new Scorm12Simulator({ persistToStorage: true });
    api.LMSInitialize();
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("completed");
  });

  it("ignores corrupt preview storage payloads", () => {
    localStorage.setItem(PREVIEW_STORAGE_KEY, "{bad");
    const api = new Scorm12Simulator({ persistToStorage: true });
    api.LMSInitialize();
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("not attempted");
  });

  it("returns adapter error strings for invalid operations", () => {
    const inner = new Scorm12Simulator({ persistToStorage: false });
    const adapter = new Scorm12Adapter(inner);
    expect(adapter.LMSGetValue("cmi.core.lesson_status")).toBe("");
    expect(adapter.LMSGetErrorString("301")).toBe("Not initialized");
    adapter.LMSInitialize();
    adapter.LMSFinish();
    expect(adapter.LMSFinish()).toBe("false");
    expect(adapter.LMSGetErrorString()).toBe("Already terminated");
  });

  it("sets score min and max through the simulator", () => {
    const api = new Scorm12Simulator({ persistToStorage: false });
    api.LMSInitialize();
    expect(api.LMSSetValue("cmi.core.score.min", "10")).toBe("true");
    expect(api.LMSSetValue("cmi.core.score.max", "90")).toBe("true");
    expect(api.LMSGetValue("cmi.core.score.min")).toBe("10");
  });

  it("finds APIs on parent windows when available", () => {
    const lms = new Scorm12Simulator({ persistToStorage: false });
    const parent = { API: lms } as unknown as Window;
    vi.spyOn(window, "parent", "get").mockReturnValue(parent);
    expect(findLmsApi()).toBe(lms);
  });

  it("falls back when parent access throws", () => {
    vi.spyOn(window, "parent", "get").mockImplementation(() => {
      throw new Error("cross-origin");
    });
    expect(findLmsApi()).toBeNull();
  });

  it("continues when reading API on a frame throws", () => {
    const lms = new Scorm12Simulator({ persistToStorage: false });
    const parent = {
      get API() {
        throw new Error("blocked");
      },
      parent: { API: lms },
    } as unknown as Window;
    vi.spyOn(window, "parent", "get").mockReturnValue(parent);
    expect(findLmsApi()).toBe(lms);
  });

  it("rejects double initialize on Scorm12Adapter", () => {
    const inner = new Scorm12Simulator({ persistToStorage: false });
    const adapter = new Scorm12Adapter(inner);
    expect(adapter.LMSInitialize()).toBe("true");
    expect(adapter.LMSInitialize()).toBe("false");
    expect(adapter.LMSGetDiagnostic()).toBe("");
  });

  it("uses default simulator options when none are provided", () => {
    const api = new Scorm12Simulator();
    api.LMSInitialize();
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("not attempted");
  });

  it("uses adapter when LMS API is discovered for scorm12", () => {
    const lms = new Scorm12Simulator({ persistToStorage: false });
    (window as Window & { API?: typeof lms }).API = lms;
    const conn = createScormConnection("scorm12");
    expect(conn).toBeInstanceOf(Scorm12Adapter);
  });

  it("blocks adapter reads and writes after terminate", () => {
    const inner = new Scorm12Simulator({ persistToStorage: false });
    const adapter = new Scorm12Adapter(inner);
    adapter.LMSInitialize();
    adapter.LMSFinish();
    expect(adapter.LMSGetValue("cmi.core.lesson_status")).toBe("");
    expect(adapter.LMSSetValue("cmi.core.lesson_status", "completed")).toBe(
      "false",
    );
    expect(adapter.LMSCommit()).toBe("false");
  });

  it("warns and uses in-memory simulator when no LMS API exists", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const conn = createScormConnection("scorm12");
    expect(conn).toBeInstanceOf(Scorm12Simulator);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("No LMS SCORM API found"),
    );
  });

  it("walks window.opener when parent chain ends", () => {
    const lms = new Scorm12Simulator({ persistToStorage: false });
    const opener = { API: lms, closed: false } as unknown as Window;
    vi.spyOn(window, "parent", "get").mockReturnValue(window);
    vi.spyOn(window, "opener", "get").mockReturnValue(opener);
    expect(findLmsApi()).toBe(lms);
  });

  it("delegates helper methods through Scorm12Adapter", () => {
    const inner = new Scorm12Simulator({ persistToStorage: false });
    const adapter = new Scorm12Adapter(inner);
    adapter.LMSInitialize();
    adapter.setLessonStatus("completed");
    adapter.setScore(88, 100);
    adapter.setSuspendData('{"x":1}');
    adapter.setLessonLocation("lesson-2");
    expect(inner.LMSGetValue("cmi.core.lesson_status")).toBe("completed");
    expect(inner.LMSGetValue("cmi.core.score.raw")).toBe("88");
    expect(inner.LMSGetValue("cmi.suspend_data")).toBe('{"x":1}');
    expect(inner.LMSGetValue("cmi.core.lesson_location")).toBe("lesson-2");
    expect(adapter.LMSCommit()).toBe("true");
    expect(adapter.LMSGetLastError()).toBe("0");
    expect(adapter.LMSGetErrorString("999")).toBe("No error");
    expect(adapter.LMSGetDiagnostic("301")).toBe("");
  });

  it("trims suspend_data when set via LMSSetValue on Scorm12Adapter", () => {
    const inner = new Scorm12Simulator({ persistToStorage: false });
    const adapter = new Scorm12Adapter(inner);
    adapter.LMSInitialize();
    const oversized = "x".repeat(SCORM_SUSPEND_DATA_MAX + 500);
    adapter.LMSSetValue("cmi.suspend_data", oversized);
    expect(inner.LMSGetValue("cmi.suspend_data").length).toBeLessThanOrEqual(
      SCORM_SUSPEND_DATA_MAX,
    );
  });

  it("reads entry and exit CMI elements from simulator", () => {
    const api = new Scorm12Simulator({ persistToStorage: false });
    api.LMSInitialize();
    expect(api.LMSGetValue("cmi.core.entry")).toBe("ab-initio");
    expect(api.LMSGetValue("cmi.core.exit")).toBe("");
  });
});
