import type { RuntimeConfig } from "../types.js";
import { createScormConnection } from "../scorm-api.js";
import { createScorm2004Connection } from "../scorm2004-api.js";
import type { LmsBridge } from "./bridge.js";
import { Scorm12Bridge } from "./scorm12-bridge.js";
import { Scorm2004Bridge } from "./scorm2004-bridge.js";
import { LocalBridge } from "./local-bridge.js";

export function progressStorageKey(
  title: string,
  version: string,
): string {
  const slug = `${title}::${version}`;
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return `lxpack_progress_${Math.abs(hash)}`;
}

export function createLmsBridge(
  mode: RuntimeConfig["mode"],
  storageKey: string,
): LmsBridge {
  if (mode === "scorm12") {
    return new Scorm12Bridge(createScormConnection("scorm12"));
  }
  if (mode === "scorm2004") {
    return new Scorm2004Bridge(createScorm2004Connection("scorm2004"));
  }
  if (mode === "preview" || mode === "standalone") {
    return new LocalBridge(storageKey);
  }
  return new LocalBridge(storageKey);
}
