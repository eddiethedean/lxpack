/**
 * Minimal SCORM 1.2 API implementation for LMS communication.
 * @see https://scorm.com/scorm-explained/technical-scorm/run-time/
 */

export interface ScormData {
  lessonStatus: "not attempted" | "incomplete" | "completed" | "passed" | "failed";
  scoreRaw: number;
  scoreMin: number;
  scoreMax: number;
  suspendData: string;
  lessonLocation: string;
}

const STORAGE_KEY = "lxpack_scorm12";

export class Scorm12API {
  private data: ScormData = {
    lessonStatus: "not attempted",
    scoreRaw: 0,
    scoreMin: 0,
    scoreMax: 100,
    suspendData: "",
    lessonLocation: "",
  };

  private initialized = false;
  private terminated = false;

  constructor() {
    this.loadFromStorage();
  }

  LMSInitialize(): string {
    if (this.initialized) return "false";
    this.initialized = true;
    this.terminated = false;
    return "true";
  }

  LMSFinish(): string {
    if (!this.initialized || this.terminated) return "false";
    this.terminated = true;
    this.saveToStorage();
    return "true";
  }

  LMSGetValue(element: string): string {
    if (!this.initialized) return "";
    switch (element) {
      case "cmi.core.lesson_status":
        return this.data.lessonStatus;
      case "cmi.core.score.raw":
        return String(this.data.scoreRaw);
      case "cmi.core.score.min":
        return String(this.data.scoreMin);
      case "cmi.core.score.max":
        return String(this.data.scoreMax);
      case "cmi.suspend_data":
        return this.data.suspendData;
      case "cmi.core.lesson_location":
        return this.data.lessonLocation;
      case "cmi.core.student_id":
        return "lxpack-learner";
      case "cmi.core.student_name":
        return "LXPack Learner";
      default:
        return "";
    }
  }

  LMSSetValue(element: string, value: string): string {
    if (!this.initialized) return "false";
    switch (element) {
      case "cmi.core.lesson_status":
        this.data.lessonStatus = value as ScormData["lessonStatus"];
        break;
      case "cmi.core.score.raw":
        this.data.scoreRaw = Number(value);
        break;
      case "cmi.suspend_data":
        this.data.suspendData = value;
        break;
      case "cmi.core.lesson_location":
        this.data.lessonLocation = value;
        break;
      default:
        return "false";
    }
    this.saveToStorage();
    return "true";
  }

  LMSCommit(): string {
    this.saveToStorage();
    return "true";
  }

  LMSGetLastError(): string {
    return "0";
  }

  LMSGetErrorString(): string {
    return "No error";
  }

  LMSGetDiagnostic(): string {
    return "";
  }

  setLessonStatus(status: ScormData["lessonStatus"]): void {
    this.data.lessonStatus = status;
    this.saveToStorage();
  }

  setScore(raw: number, max = 100): void {
    this.data.scoreRaw = raw;
    this.data.scoreMax = max;
    this.saveToStorage();
  }

  setSuspendData(data: string): void {
    this.data.suspendData = data;
    this.saveToStorage();
  }

  setLessonLocation(location: string): void {
    this.data.lessonLocation = location;
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = { ...this.data, ...JSON.parse(stored) };
      }
    } catch {
      void 0;
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      void 0;
    }
  }
}

export function installScormAPI(): Scorm12API {
  const api = new Scorm12API();
  const win = window as Window & {
    API?: Scorm12API;
    API_1484_11?: Scorm12API;
  };
  win.API = api;
  return api;
}
