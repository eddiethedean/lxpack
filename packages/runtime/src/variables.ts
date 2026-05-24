import type { CourseManifest } from "@lxpack/validators";

export const VARIABLE_PREFIX = "v:";

export function manifestVariableKey(name: string): string {
  return `${VARIABLE_PREFIX}${name}`;
}

export function initManifestVariables(
  manifest: CourseManifest,
  suspendData: Record<string, unknown>,
): void {
  for (const [name, def] of Object.entries(manifest.variables ?? {})) {
    const key = manifestVariableKey(name);
    if (suspendData[key] === undefined) {
      suspendData[key] = def.default;
    }
  }
}

export function readManifestVariable(
  suspendData: Record<string, unknown>,
  name: string,
): unknown {
  return suspendData[manifestVariableKey(name)];
}

export function writeManifestVariable(
  suspendData: Record<string, unknown>,
  name: string,
  value: unknown,
): void {
  suspendData[manifestVariableKey(name)] = value;
}
