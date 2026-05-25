import type { ExportTarget } from "@lxpack/scorm";
import type { LxpackConfig } from "./lxpack-config.js";

/** Same target resolution as `lxpack build` (CLI flag overrides config default). */
export function resolveExportTarget(
  cliTarget: string | undefined,
  config: LxpackConfig | null,
): ExportTarget | undefined {
  if (cliTarget !== undefined) {
    return cliTarget as ExportTarget;
  }
  return config?.exports?.defaultTarget;
}
