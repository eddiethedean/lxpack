import {
  validateCourse,
  validateXapiTracking,
  type ValidationIssue,
} from "@lxpack/validators";
import type { ExportTarget } from "@lxpack/scorm";
import pc from "picocolors";
import { findCourseDir } from "../utils.js";
import {
  formatInvalidTargetMessage,
  isValidExportTarget,
} from "../lib/targets.js";

const XAPI_TARGETS: ExportTarget[] = ["xapi", "cmi5"];

export async function validateCommand(options?: {
  target?: string;
}): Promise<void> {
  if (options?.target !== undefined && !isValidExportTarget(options.target)) {
    console.error(pc.red(formatInvalidTargetMessage(options.target)));
    process.exit(1);
  }

  const courseDir = findCourseDir();
  const result = await validateCourse(courseDir);
  const issues: ValidationIssue[] = [...result.issues];

  const target = options?.target as ExportTarget | undefined;
  const needsXapiCheck =
    (target && XAPI_TARGETS.includes(target)) ||
    Boolean(result.manifest?.tracking?.xapi);

  if (needsXapiCheck && result.manifest) {
    issues.push(...validateXapiTracking(result.manifest));
  }

  if (result.manifest) {
    console.log(
      pc.dim(`Course: ${result.manifest.title} v${result.manifest.version}`),
    );
    console.log(pc.dim(`Lessons: ${result.manifest.lessons.length}`));
    console.log();
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  const valid = result.valid && !hasErrors;

  for (const issue of issues) {
    const icon = issue.severity === "error" ? pc.red("✗") : pc.yellow("!");
    console.log(`${icon} ${issue.path}: ${issue.message}`);
  }

  if (valid) {
    console.log(pc.green("✓ Course validation passed"));
    process.exit(0);
  } else {
    console.log(pc.red("✗ Course validation failed"));
    process.exit(1);
  }
}
