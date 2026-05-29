import type { LxpackBridgeV1, LxpackBridgeVersion } from "./types.js";

export function supportedBridgeVersions(): LxpackBridgeVersion[] {
  return ["v1"];
}

/** Read `window.parent.lxpackBridge.v1` when running inside an SPA iframe. */
export function getLxpackBridge(
  parentWindow: Window = window.parent,
): LxpackBridgeV1 | null {
  try {
    const root = parentWindow.lxpackBridge;
    return root?.v1 ?? null;
  } catch {
    return null;
  }
}
