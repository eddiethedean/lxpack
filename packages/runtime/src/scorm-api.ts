/**
 * SCORM 1.2 API — LMS discovery, adapter, and preview simulator.
 * @see https://scorm.com/scorm-explained/technical-scorm/run-time/
 */

export interface ScormData {
  lessonStatus: "not attempted" | "incomplete" | "completed" | "passed" | "failed";
  scoreRaw: number;
  scoreMin: number;
  scoreMax: number;
  suspendData: string;
  lessonLocation: string;
  entry: string;
  exit: string;
  sessionTime: string;
}

export interface ScormApiLike {
  LMSInitialize(param?: string): string;
  LMSFinish(param?: string): string;
  LMSGetValue(element: string): string;
  LMSSetValue(element: string, value: string): string;
  LMSCommit(param?: string): string;
  LMSGetLastError(): string;
  LMSGetErrorString(errorCode?: string): string;
  LMSGetDiagnostic(errorCode?: string): string;
}

const SCORM_ERROR_NONE = "0";
const SCORM_ERROR_NOT_INITIALIZED = "301";
const SCORM_ERROR_TERMINATED = "302";
import { SCORM_SUSPEND_DATA_MAX } from "./progress/constants.js";
import { trimSuspendData as trimSuspendDataPolicy } from "./progress/size-policy.js";
const PREVIEW_STORAGE_KEY = "lxpack_scorm12_preview";

export function findLmsApi(maxDepth = 500): ScormApiLike | null {
  let win: Window | null = window;
  let depth = 0;

  while (win && depth < maxDepth) {
    try {
      const candidate = (win as Window & { API?: ScormApiLike }).API;
      if (candidate && typeof candidate.LMSInitialize === "function") {
        return candidate;
      }
    } catch {
      // cross-origin frame
    }

    try {
      if (win.parent && win.parent !== win) {
        win = win.parent;
      } else if (win.opener && !win.opener.closed) {
        win = win.opener;
      } else {
        break;
      }
    } catch {
      break;
    }
    depth++;
  }

  return null;
}

export class Scorm12Adapter implements ScormApiLike {
  private api: ScormApiLike;
  private initialized = false;
  private terminated = false;
  private lastError = SCORM_ERROR_NONE;

  constructor(api: ScormApiLike) {
    this.api = api;
  }

  LMSInitialize(): string {
    if (this.initialized) {
      this.lastError = SCORM_ERROR_NOT_INITIALIZED;
      return "false";
    }
    const result = this.api.LMSInitialize("");
    if (result === "true") {
      this.initialized = true;
      this.terminated = false;
      this.lastError = SCORM_ERROR_NONE;
    }
    return result;
  }

  LMSFinish(): string {
    if (!this.initialized || this.terminated) {
      this.lastError = SCORM_ERROR_TERMINATED;
      return "false";
    }
    const result = this.api.LMSFinish("");
    if (result === "true") {
      this.terminated = true;
      this.lastError = SCORM_ERROR_NONE;
    }
    return result;
  }

  LMSGetValue(element: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = SCORM_ERROR_NOT_INITIALIZED;
      return "";
    }
    this.lastError = SCORM_ERROR_NONE;
    return this.api.LMSGetValue(element);
  }

  LMSSetValue(element: string, value: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = SCORM_ERROR_NOT_INITIALIZED;
      return "false";
    }
    this.lastError = SCORM_ERROR_NONE;
    const normalized =
      element === "cmi.suspend_data" ? trimSuspendData(value) : value;
    return this.api.LMSSetValue(element, normalized);
  }

  LMSCommit(): string {
    if (!this.initialized || this.terminated) {
      this.lastError = SCORM_ERROR_NOT_INITIALIZED;
      return "false";
    }
    this.lastError = SCORM_ERROR_NONE;
    return this.api.LMSCommit("");
  }

  LMSGetLastError(): string {
    return this.lastError;
  }

  LMSGetErrorString(errorCode?: string): string {
    const code = errorCode ?? this.lastError;
    if (code === SCORM_ERROR_NOT_INITIALIZED) return "Not initialized";
    if (code === SCORM_ERROR_TERMINATED) return "Already terminated";
    return this.api.LMSGetErrorString(code);
  }

  LMSGetDiagnostic(errorCode?: string): string {
    return this.api.LMSGetDiagnostic(errorCode ?? this.lastError);
  }

  setLessonStatus(status: ScormData["lessonStatus"]): void {
    this.LMSSetValue("cmi.core.lesson_status", status);
  }

  setScore(raw: number, max = 100): void {
    this.LMSSetValue("cmi.core.score.raw", String(raw));
    this.LMSSetValue("cmi.core.score.max", String(max));
    this.LMSSetValue("cmi.core.score.min", "0");
  }

  setSuspendData(data: string): void {
    const trimmed = trimSuspendData(data);
    this.LMSSetValue("cmi.suspend_data", trimmed);
  }

  setLessonLocation(location: string): void {
    this.LMSSetValue("cmi.core.lesson_location", location);
  }
}

export class Scorm12Simulator implements ScormApiLike {
  private data: ScormData = {
    lessonStatus: "not attempted",
    scoreRaw: 0,
    scoreMin: 0,
    scoreMax: 100,
    suspendData: "",
    lessonLocation: "",
    entry: "ab-initio",
    exit: "",
    sessionTime: "00:00:00",
  };

  private initialized = false;
  private terminated = false;
  private lastError = SCORM_ERROR_NONE;
  private persistToStorage: boolean;

  constructor(options: {
    persistToStorage?: boolean;
    initialData?: Partial<ScormData>;
  } = {}) {
    this.persistToStorage = options.persistToStorage ?? false;
    if (options.initialData) {
      this.data = { ...this.data, ...options.initialData };
    }
    if (this.persistToStorage) {
      this.loadFromStorage();
    }
  }

  LMSInitialize(): string {
    if (this.initialized) {
      this.lastError = SCORM_ERROR_NOT_INITIALIZED;
      return "false";
    }
    this.initialized = true;
    this.terminated = false;
    this.lastError = SCORM_ERROR_NONE;
    return "true";
  }

  LMSFinish(): string {
    if (!this.initialized || this.terminated) {
      this.lastError = SCORM_ERROR_TERMINATED;
      return "false";
    }
    this.data.exit = "suspend";
    this.terminated = true;
    this.saveToStorage();
    this.lastError = SCORM_ERROR_NONE;
    return "true";
  }

  LMSGetValue(element: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = SCORM_ERROR_NOT_INITIALIZED;
      return "";
    }
    this.lastError = SCORM_ERROR_NONE;
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
      case "cmi.core.entry":
        return this.data.entry;
      case "cmi.core.exit":
        return this.data.exit;
      case "cmi.core.session_time":
        return this.data.sessionTime;
      default:
        return "";
    }
  }

  LMSSetValue(element: string, value: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = SCORM_ERROR_NOT_INITIALIZED;
      return "false";
    }
    this.lastError = SCORM_ERROR_NONE;
    switch (element) {
      case "cmi.core.lesson_status":
        this.data.lessonStatus = value as ScormData["lessonStatus"];
        break;
      case "cmi.core.score.raw":
        this.data.scoreRaw = Number(value);
        break;
      case "cmi.core.score.min":
        this.data.scoreMin = Number(value);
        break;
      case "cmi.core.score.max":
        this.data.scoreMax = Number(value);
        break;
      case "cmi.suspend_data":
        this.data.suspendData = trimSuspendData(value);
        break;
      case "cmi.core.lesson_location":
        this.data.lessonLocation = value;
        break;
      case "cmi.core.exit":
        this.data.exit = value;
        break;
      case "cmi.core.session_time":
        this.data.sessionTime = value;
        break;
      default:
        return "false";
    }
    this.saveToStorage();
    return "true";
  }

  LMSCommit(): string {
    if (!this.initialized || this.terminated) {
      this.lastError = SCORM_ERROR_NOT_INITIALIZED;
      return "false";
    }
    this.saveToStorage();
    this.lastError = SCORM_ERROR_NONE;
    return "true";
  }

  LMSGetLastError(): string {
    return this.lastError;
  }

  LMSGetErrorString(errorCode?: string): string {
    const code = errorCode ?? this.lastError;
    if (code === SCORM_ERROR_NOT_INITIALIZED) return "Not initialized";
    if (code === SCORM_ERROR_TERMINATED) return "Already terminated";
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
    this.data.scoreMin = 0;
    this.saveToStorage();
  }

  setSuspendData(data: string): void {
    this.data.suspendData = trimSuspendData(data);
    this.saveToStorage();
  }

  setLessonLocation(location: string): void {
    this.data.lessonLocation = location;
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(PREVIEW_STORAGE_KEY);
      if (stored) {
        this.data = { ...this.data, ...JSON.parse(stored) };
      }
    } catch {
      void 0;
    }
  }

  private saveToStorage(): void {
    if (!this.persistToStorage) return;
    try {
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      void 0;
    }
  }
}

/**
 * @deprecated Use `createScormConnection` or `installScormAPI` instead.
 * Kept for backward compatibility with pre-0.2 import paths.
 */
export class Scorm12API extends Scorm12Simulator {
  constructor() {
    super({ persistToStorage: true });
  }
}

export type ScormConnection = Scorm12Adapter | Scorm12Simulator;

export function trimSuspendData(data: string): string {
  return trimSuspendDataPolicy(data);
}

export function createScormConnection(
  mode: "preview" | "standalone" | "scorm12",
): ScormConnection {
  if (mode === "preview") {
    return new Scorm12Simulator({ persistToStorage: true });
  }

  if (mode === "scorm12") {
    const lmsApi = findLmsApi();
    if (lmsApi) {
      return new Scorm12Adapter(lmsApi);
    }
    console.warn(
      "[lxpack] No LMS SCORM API found; using in-memory simulator (progress will not persist to LMS)",
    );
    return new Scorm12Simulator({ persistToStorage: false });
  }

  return new Scorm12Simulator({ persistToStorage: false });
}

export function installScormAPI(
  mode: "preview" | "standalone" | "scorm12" = "preview",
): ScormConnection {
  const connection = createScormConnection(mode);
  if (mode === "preview") {
    const win = window as Window & { API?: ScormConnection };
    win.API = connection;
  }
  return connection;
}

export { SCORM_SUSPEND_DATA_MAX };
