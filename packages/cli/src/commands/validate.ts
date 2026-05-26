import {
  formatErrorMessage,
  validateCourse,
  type ValidationIssue,
} from "@lxpack/validators";
import type { ExportTarget } from "@lxpack/scorm";
import pc from "picocolors";
import { findCourseDir, loadLxpackConfig } from "../utils.js";
import {
  formatInvalidTargetMessage,
  isValidExportTarget,
} from "../lib/targets.js";
import { resolveExportTarget } from "../lib/resolve-export-target.js";

export async function validateCommand(options?: {
  target?: string;
}): Promise<void> {
  if (options?.target !== undefined && !isValidExportTarget(options.target)) {
    console.error(pc.red(formatInvalidTargetMessage(options.target)));
    process.exit(1);
  }

  const courseDir = findCourseDir();

  let config;
  try {
    config = await loadLxpackConfig(courseDir);
  } catch (err) {
    console.error(pc.red(formatErrorMessage(err)));
    process.exit(1);
  }

  const target = resolveExportTarget(options?.target, config) as
    | ExportTarget
    | undefined;

  const result = await validateCourse(courseDir, {
    exportTarget: target,
  });
  const issues: ValidationIssue[] = [...result.issues];

  if (result.manifest) {
    console.log(
      pc.dim(`Course: ${result.manifest.title} v${result.manifest.version}`),
    );
    console.log(pc.dim(`Lessons: ${result.manifest.lessons.length}`));
    console.log();
  }

  const valid = result.valid;

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
