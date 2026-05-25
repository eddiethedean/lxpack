import type { ExportTarget } from "@lxpack/scorm";

export const VALID_EXPORT_TARGETS: ExportTarget[] = [
  "scorm12",
  "scorm2004",
  "standalone",
  "xapi",
  "cmi5",
];

export function isValidExportTarget(
  target: string,
): target is ExportTarget {
  return (VALID_EXPORT_TARGETS as string[]).includes(target);
}

export function formatInvalidTargetMessage(target: string): string {
  return `Invalid target: ${target}. Valid targets: ${VALID_EXPORT_TARGETS.join(", ")}`;
}
