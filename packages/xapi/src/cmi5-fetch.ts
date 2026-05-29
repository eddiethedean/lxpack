import type { LaunchParams } from "./launch.js";

export class Cmi5FetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Cmi5FetchError";
  }
}

export interface Cmi5FetchResponse {
  "auth-token"?: string;
  "authToken"?: string;
  "error-code"?: string;
  "error-text"?: string;
  errorCode?: string;
  errorText?: string;
}

const CMI5_AUTH_STORAGE_PREFIX = "lxpack_cmi5_auth:";

function storageKey(fetchUrl: string): string {
  return `${CMI5_AUTH_STORAGE_PREFIX}${fetchUrl}`;
}

export function readCachedCmi5AuthToken(fetchUrl: string): string | undefined {
  if (typeof sessionStorage === "undefined") {
    return undefined;
  }
  try {
    return sessionStorage.getItem(storageKey(fetchUrl)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeCachedCmi5AuthToken(fetchUrl: string, token: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(storageKey(fetchUrl), token);
  } catch {
    void 0;
  }
}

function parseAuthToken(body: Cmi5FetchResponse): string {
  const token = body["auth-token"] ?? body.authToken;
  if (typeof token === "string" && token.length > 0) {
    return token;
  }
  const errorCode = body["error-code"] ?? body.errorCode;
  const errorText = body["error-text"] ?? body.errorText;
  if (errorCode || errorText) {
    throw new Cmi5FetchError(
      `cmi5 fetch URL returned an error${errorCode ? ` (${errorCode})` : ""}: ${errorText ?? "unknown"}`,
    );
  }
  throw new Cmi5FetchError(
    "cmi5 fetch response did not include auth-token",
  );
}

/**
 * Retrieve the cmi5 session auth token (POST per cmi5 spec; GET is not allowed).
 */
export async function fetchCmi5AuthToken(
  fetchUrl: string,
  init?: RequestInit,
): Promise<string> {
  const cached = readCachedCmi5AuthToken(fetchUrl);
  if (cached) {
    return cached;
  }

  const res = await fetch(fetchUrl, {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
    body: init?.body ?? undefined,
  });

  if (!res.ok) {
    throw new Cmi5FetchError(
      `cmi5 fetch URL returned HTTP ${res.status}`,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Cmi5FetchError(
      "cmi5 fetch response must have Content-Type application/json",
    );
  }

  const body = (await res.json()) as Cmi5FetchResponse;
  const token = parseAuthToken(body);
  writeCachedCmi5AuthToken(fetchUrl, token);
  return token;
}

/** Merge launch query params with cmi5 fetch auth (query wins on conflicts). */
export function mergeLaunchWithCmi5Fetch(
  launch: LaunchParams,
  authFromFetch: string,
): LaunchParams {
  return {
    ...launch,
    auth: launch.auth ?? authFromFetch,
  };
}

/**
 * When launch includes a cmi5 fetch URL, obtain auth-token and merge into launch params.
 * Requires `endpoint` from the launch URL for LRS communication.
 */
export async function bootstrapCmi5LaunchParams(
  launch: LaunchParams,
  init?: RequestInit,
): Promise<LaunchParams> {
  if (!launch.fetch) {
    return launch;
  }
  if (launch.auth) {
    return launch;
  }
  const auth = await fetchCmi5AuthToken(launch.fetch, init);
  return mergeLaunchWithCmi5Fetch(launch, auth);
}
