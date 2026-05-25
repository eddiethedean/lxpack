/**
 * SCORM 2004 4th Edition Run-Time API subset.
 */

import { trimSuspendData } from "./progress/size-policy.js";

export interface Scorm2004ApiLike {
  Initialize(param?: string): string;
  Terminate(param?: string): string;
  GetValue(element: string): string;
  SetValue(element: string, value: string): string;
  Commit(param?: string): string;
  GetLastError(): string;
  GetErrorString(errorCode?: string): string;
  GetDiagnostic(errorCode?: string): string;
}

const SCORM_ERROR_NONE = "0";
const PREVIEW_STORAGE_KEY = "lxpack_scorm2004_preview";

export function findScorm2004Api(maxDepth = 500): Scorm2004ApiLike | null {
  let win: Window | null = window;
  let depth = 0;

  while (win && depth < maxDepth) {
    try {
      const candidate = (win as Window & { API_1484_11?: Scorm2004ApiLike })
        .API_1484_11;
      if (candidate && typeof candidate.Initialize === "function") {
        return candidate;
      }
    } catch {
      // cross-origin
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

export class Scorm2004Simulator implements Scorm2004ApiLike {
  private initialized = false;
  private terminated = false;
  private data: Record<string, string> = {
    "cmi.completion_status": "unknown",
    "cmi.success_status": "unknown",
    "cmi.score.scaled": "",
    "cmi.suspend_data": "",
    "cmi.location": "",
    "cmi.entry": "ab-initio",
  };
  private persistToStorage: boolean;

  constructor(options?: { persistToStorage?: boolean }) {
    this.persistToStorage = options?.persistToStorage ?? false;
    if (this.persistToStorage) {
      try {
        const stored = localStorage.getItem(PREVIEW_STORAGE_KEY);
        if (stored) {
          this.data = { ...this.data, ...JSON.parse(stored) };
        }
      } catch {
        void 0;
      }
    }
  }

  private save(): void {
    if (!this.persistToStorage) return;
    try {
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      void 0;
    }
  }

  Initialize(): string {
    if (this.initialized) return "false";
    this.initialized = true;
    this.terminated = false;
    return "true";
  }

  Terminate(): string {
    if (!this.initialized || this.terminated) return "false";
    this.terminated = true;
    this.save();
    return "true";
  }

  GetValue(element: string): string {
    if (!this.initialized || this.terminated) return "";
    return this.data[element] ?? "";
  }

  SetValue(element: string, value: string): string {
    if (!this.initialized || this.terminated) return "false";
    this.data[element] =
      element === "cmi.suspend_data" ? trimSuspendData(value) : value;
    this.save();
    return "true";
  }

  Commit(): string {
    if (!this.initialized || this.terminated) return "false";
    this.save();
    return "true";
  }

  GetLastError(): string {
    return SCORM_ERROR_NONE;
  }

  GetErrorString(): string {
    return "No error";
  }

  GetDiagnostic(): string {
    return "";
  }

  setSuspendData(data: string): void {
    this.data["cmi.suspend_data"] = trimSuspendData(data);
  }

  setLocation(location: string): void {
    this.data["cmi.location"] = location;
  }

  setCompletionStatus(status: string): void {
    this.data["cmi.completion_status"] = status;
  }

  setSuccessStatus(status: string): void {
    this.data["cmi.success_status"] = status;
  }

  setScoreScaled(scaled: number): void {
    this.data["cmi.score.scaled"] = String(Math.max(0, Math.min(1, scaled)));
  }
}

export class Scorm2004Adapter implements Scorm2004ApiLike {
  private api: Scorm2004ApiLike;

  constructor(api: Scorm2004ApiLike) {
    this.api = api;
  }

  Initialize(): string {
    return this.api.Initialize("");
  }

  Terminate(): string {
    return this.api.Terminate("");
  }

  GetValue(element: string): string {
    return this.api.GetValue(element);
  }

  SetValue(element: string, value: string): string {
    const v =
      element === "cmi.suspend_data" ? trimSuspendData(value) : value;
    return this.api.SetValue(element, v);
  }

  Commit(): string {
    return this.api.Commit("");
  }

  GetLastError(): string {
    return this.api.GetLastError();
  }

  GetErrorString(errorCode?: string): string {
    return this.api.GetErrorString(errorCode);
  }

  GetDiagnostic(errorCode?: string): string {
    return this.api.GetDiagnostic(errorCode);
  }

  setSuspendData(data: string): void {
    this.api.SetValue("cmi.suspend_data", trimSuspendData(data));
  }

  setLocation(location: string): void {
    this.api.SetValue("cmi.location", location);
  }

  setCompletionStatus(status: string): void {
    this.api.SetValue("cmi.completion_status", status);
  }

  setSuccessStatus(status: string): void {
    this.api.SetValue("cmi.success_status", status);
  }

  setScoreScaled(scaled: number): void {
    this.api.SetValue("cmi.score.scaled", String(Math.max(0, Math.min(1, scaled))));
  }
}

export type Scorm2004Connection = Scorm2004Simulator | Scorm2004Adapter;

export function createScorm2004Connection(
  mode: "preview" | "scorm2004",
): Scorm2004Connection {
  if (mode === "preview") {
    return new Scorm2004Simulator({ persistToStorage: true });
  }

  const lmsApi = findScorm2004Api();
  if (lmsApi) {
    return new Scorm2004Adapter(lmsApi);
  }
  console.warn(
    "[lxpack] No SCORM 2004 API found; using in-memory simulator",
  );
  return new Scorm2004Simulator({ persistToStorage: false });
}

export function installScorm2004API(
  mode: "preview" | "scorm2004" = "preview",
): Scorm2004Connection {
  const connection = createScorm2004Connection(
    mode === "preview" ? "preview" : "scorm2004",
  );
  if (mode === "preview") {
    const win = window as Window & { API_1484_11?: Scorm2004Connection };
    win.API_1484_11 = connection;
  }
  return connection;
}
