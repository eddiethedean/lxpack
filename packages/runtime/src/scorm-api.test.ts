import { describe, it, expect, vi } from "vitest";
import { Scorm12Adapter, Scorm12API, Scorm12Simulator, createScormConnection, findLmsApi, installScormAPI, trimSuspendData } from "./scorm-api.js";

const PREVIEW_STORAGE_KEY = "lxpack_scorm12_preview";

describe("Scorm12API", () => {
  it("requires LMSInitialize before get/set", () => {
    const api = new Scorm12API();
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("");
    expect(api.LMSGetValue("cmi.core.student_id")).toBe("");
    expect(api.LMSGetValue("cmi.core.student_name")).toBe("");
    expect(api.LMSSetValue("cmi.core.lesson_status", "completed")).toBe("false");
    expect(api.LMSInitialize()).toBe("true");
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("not attempted");
    expect(api.LMSGetValue("cmi.core.student_id")).toBe("lxpack-learner");
    expect(api.LMSGetValue("cmi.core.score.min")).toBe("0");
    expect(api.LMSGetValue("cmi.core.score.max")).toBe("100");
  });

  it("reads and writes SCORM 1.2 data elements", () => {
    const api = new Scorm12API();
    api.LMSInitialize();

    expect(api.LMSSetValue("cmi.core.lesson_status", "incomplete")).toBe("true");
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("incomplete");

    expect(api.LMSSetValue("cmi.core.score.raw", "85")).toBe("true");
    expect(api.LMSGetValue("cmi.core.score.raw")).toBe("85");

    expect(api.LMSSetValue("cmi.suspend_data", '{"step":2}')).toBe("true");
    expect(api.LMSGetValue("cmi.suspend_data")).toBe('{"step":2}');

    expect(api.LMSSetValue("cmi.core.lesson_location", "lesson-2")).toBe("true");
    expect(api.LMSGetValue("cmi.core.lesson_location")).toBe("lesson-2");
  });

  it("returns learner identity fields", () => {
    const api = new Scorm12API();
    api.LMSInitialize();
    expect(api.LMSGetValue("cmi.core.student_id")).toBe("lxpack-learner");
    expect(api.LMSGetValue("cmi.core.student_name")).toBe("LXPack Learner");
  });

  it("persists state to localStorage across instances", () => {
    const api1 = new Scorm12API();
    api1.LMSInitialize();
    api1.setLessonStatus("completed");
    api1.setScore(90);
    api1.LMSFinish();

    const api2 = new Scorm12API();
    api2.LMSInitialize();
    expect(api2.LMSGetValue("cmi.core.lesson_status")).toBe("completed");
    expect(api2.LMSGetValue("cmi.core.score.raw")).toBe("90");
  });

  it("rejects double initialize and finish after terminate", () => {
    const api = new Scorm12API();
    expect(api.LMSInitialize()).toBe("true");
    expect(api.LMSInitialize()).toBe("false");
    expect(api.LMSFinish()).toBe("true");
    expect(api.LMSFinish()).toBe("false");
    expect(api.LMSGetErrorString()).toBe("Already terminated");
    expect(api.LMSGetErrorString("301")).toBe("Not initialized");
  });

  it("returns false for unknown LMSSetValue elements", () => {
    const api = new Scorm12API();
    api.LMSInitialize();
    expect(api.LMSSetValue("cmi.unknown", "x")).toBe("false");
  });

  it("loads corrupt localStorage without throwing", () => {
    localStorage.setItem(PREVIEW_STORAGE_KEY, "not-json{{{");
    const api = new Scorm12API();
    api.LMSInitialize();
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("not attempted");
  });

  it("returns empty string for unknown LMSGetValue elements", () => {
    const api = new Scorm12API();
    api.LMSInitialize();
    expect(api.LMSGetValue("cmi.unknown")).toBe("");
  });

  it("returns diagnostic helpers", () => {
    const api = new Scorm12API();
    expect(api.LMSGetLastError()).toBe("0");
    expect(api.LMSGetErrorString()).toBe("No error");
    expect(api.LMSGetDiagnostic()).toBe("");
  });

  it("swallows localStorage write failures", () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: () => {
          throw new Error("full");
        },
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
        get length() {
          return store.size;
        },
        key: () => null,
      },
      configurable: true,
    });
    const api = new Scorm12API();
    api.LMSInitialize();
    expect(() => api.setLessonStatus("completed")).not.toThrow();
  });
  it("installs API on window in preview mode", () => {
    const api = installScormAPI("preview");
    expect(window.API).toBe(api);
  });

  it("finds LMS API in parent chain", () => {
    const lms = new Scorm12Simulator({ persistToStorage: false });
    (window as Window & { API?: typeof lms }).API = lms;
    expect(findLmsApi()).toBe(lms);
  });

  it("sets exit and session time through LMSSetValue", () => {
    const api = new Scorm12Simulator({ persistToStorage: false });
    api.LMSInitialize();
    expect(api.LMSSetValue("cmi.core.exit", "logout")).toBe("true");
    expect(api.LMSSetValue("cmi.core.session_time", "00:05:00")).toBe("true");
    expect(api.LMSGetValue("cmi.core.exit")).toBe("logout");
    expect(api.LMSGetValue("cmi.core.session_time")).toBe("00:05:00");
  });

  it("sets lesson location via helper", () => {
    const api = new Scorm12API();
    api.LMSInitialize();
    api.setLessonLocation("lesson-3");
    expect(api.LMSGetValue("cmi.core.lesson_location")).toBe("lesson-3");
  });

  it("ignores localStorage read failures when loading", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const api = new Scorm12API();
    api.LMSInitialize();
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("not attempted");
  });

  it("uses in-memory simulator when no LMS API is found in scorm12 mode", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const conn = createScormConnection("scorm12");
    conn.LMSInitialize();
    expect(conn.LMSGetValue("cmi.core.lesson_status")).toBe("not attempted");
  });

  it("trims suspend_data that exceeds SCORM limits", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const long = JSON.stringify({
      currentLessonId: "intro",
      completedLessons: Array.from({ length: 80 }, (_, i) => `lesson-${i}`),
      assessmentScores: {},
      suspendData: { blob: "x".repeat(5000) },
    });
    const trimmed = trimSuspendData(long);
    expect(trimmed.length).toBeLessThanOrEqual(4096);
    expect(() => JSON.parse(trimmed)).not.toThrow();
  });

  it("creates standalone connections without preview storage", () => {
    const conn = createScormConnection("standalone");
    conn.LMSInitialize();
    expect(conn.LMSGetValue("cmi.core.lesson_status")).toBe("not attempted");
  });

  it("wraps discovered LMS APIs with an adapter", () => {
    const inner = new Scorm12Simulator({ persistToStorage: false });
    (window as Window & { API?: typeof inner }).API = inner;
    const conn = createScormConnection("scorm12");
    expect(conn).toBeInstanceOf(Scorm12Adapter);
    conn.LMSInitialize();
    conn.LMSSetValue("cmi.core.lesson_status", "completed");
    expect(inner.LMSGetValue("cmi.core.lesson_status")).toBe("completed");
  });

  it("supports simulator exit and session time fields", () => {
    const api = new Scorm12Simulator({ persistToStorage: false });
    api.LMSInitialize();
    expect(api.LMSSetValue("cmi.core.exit", "suspend")).toBe("true");
    expect(api.LMSSetValue("cmi.core.session_time", "00:01:00")).toBe("true");
    expect(api.LMSGetValue("cmi.core.session_time")).toBe("00:01:00");
    expect(api.LMSSetValue("cmi.unknown", "x")).toBe("false");
  });

  it("returns errors when committing before initialize", () => {
    const api = new Scorm12Simulator({ persistToStorage: false });
    expect(api.LMSCommit()).toBe("false");
    expect(api.LMSGetLastError()).not.toBe("0");
  });

  it("installs preview API on window only in preview mode", () => {
    const preview = installScormAPI("preview");
    expect(window.API).toBe(preview);
    const standalone = installScormAPI("standalone");
    expect(standalone).not.toBe(preview);
  });
});
