import { describe, it, expect, vi } from "vitest";
import { Scorm12API, installScormAPI } from "./scorm-api.js";

const STORAGE_KEY = "lxpack_scorm12";

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
  });

  it("returns false for unknown LMSSetValue elements", () => {
    const api = new Scorm12API();
    api.LMSInitialize();
    expect(api.LMSSetValue("cmi.unknown", "x")).toBe("false");
  });

  it("loads corrupt localStorage without throwing", () => {
    localStorage.setItem(STORAGE_KEY, "not-json{{{");
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
  it("installs API on window", () => {
    const api = installScormAPI();
    expect(window.API).toBe(api);
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
});
