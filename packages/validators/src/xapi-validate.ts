import type { CourseManifest } from "./schemas.js";
import type { ValidationIssue } from "./validate.js";

export interface ValidateXapiTrackingOptions {
  /** When true, missing `tracking.xapi` is an error (xapi/cmi5 export). */
  requireForExport?: boolean;
}

export function validateXapiTracking(
  manifest: CourseManifest,
  options?: ValidateXapiTrackingOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const xapi = manifest.tracking?.xapi;
  if (!xapi) {
    if (options?.requireForExport) {
      issues.push({
        path: "tracking.xapi",
        message:
          "tracking.xapi.activityIri is required for xapi/cmi5 export targets",
        severity: "error",
      });
    }
    return issues;
  }

  try {
    const url = new URL(xapi.activityIri);
    if (url.protocol !== "https:") {
      issues.push({
        path: "tracking.xapi.activityIri",
        message: "activityIri must use https",
        severity: "error",
      });
    }
  } catch {
    issues.push({
      path: "tracking.xapi.activityIri",
      message: "activityIri must be a valid URL",
      severity: "error",
    });
  }

  return issues;
}

export function getCourseActivityIri(
  manifest: CourseManifest,
): string | undefined {
  return manifest.tracking?.xapi?.activityIri;
}
