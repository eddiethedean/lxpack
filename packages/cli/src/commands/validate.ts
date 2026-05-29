import { rm } from "node:fs/promises";
import { validateCourse } from "@lxpack/api";
import {
  materializeLessonkitProject,
  validateCourseWithInterchange,
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
import { printValidationIssues } from "../lib/validated-course.js";
import {
  buildSpaDirsFromInterchange,
  loadLessonkitInterchangeFile,
  parseSpaLessonOption,
  validateSpaDirsForInterchange,
} from "../lib/lessonkit-build.js";

function printValidationResult(
  issues: ValidationIssue[],
  manifest: { title: string; version: string; lessons: unknown[] } | undefined,
  valid: boolean,
): void {
  if (manifest) {
    console.log(
      pc.dim(`Course: ${manifest.title} v${manifest.version}`),
    );
    console.log(pc.dim(`Lessons: ${manifest.lessons.length}`));
    console.log();
  }

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

export async function validateCommand(options?: {
  target?: string;
  lessonkit?: string;
  spaLesson?: string[];
  spaDist?: string;
}): Promise<void> {
  if (options?.target !== undefined && !isValidExportTarget(options.target)) {
    console.error(pc.red(formatInvalidTargetMessage(options.target)));
    process.exit(1);
  }

  if (options?.lessonkit) {
    const loaded = await loadLessonkitInterchangeFile(options.lessonkit);
    if (!loaded.ok) {
      console.error(pc.red("Cannot validate: invalid lessonkit interchange"));
      printValidationIssues({
        valid: false,
        issues: loaded.issues.map((i) => ({
          path: i.path ?? "lessonkit.json",
          message: i.message,
          severity: "error" as const,
        })),
      });
      process.exit(1);
    }

    let config;
    try {
      config = await loadLxpackConfig(process.cwd());
    } catch (err) {
      console.error(
        pc.red(err instanceof Error ? err.message : String(err)),
      );
      process.exit(1);
    }

    const target = resolveExportTarget(options?.target, config) as ExportTarget;
    const spaLessons = (options.spaLesson ?? []).map(parseSpaLessonOption);
    const spaDirs = buildSpaDirsFromInterchange(
      loaded.data,
      spaLessons,
      options.spaDist,
    );
    const spaDirError = validateSpaDirsForInterchange(loaded.data, spaDirs);
    if (spaDirError) {
      console.error(pc.red(`Cannot validate: ${spaDirError}`));
      process.exit(1);
    }

    const materialized = await materializeLessonkitProject({
      interchange: loaded.data,
      spaDirs,
    });

    if (!materialized.ok) {
      printValidationResult(materialized.issues, undefined, false);
      return;
    }

    const courseDir = materialized.courseDir;
    try {
      const validation = await validateCourseWithInterchange(courseDir, {
        exportTarget: target,
        assessmentData: loaded.data.assessments,
        interchange: loaded.data,
      });
      printValidationResult(
        validation.issues,
        validation.manifest,
        validation.valid,
      );
    } finally {
      await rm(courseDir, { recursive: true, force: true }).catch(() => {});
    }
    return;
  }

  const courseDir = findCourseDir();

  let config;
  try {
    config = await loadLxpackConfig(courseDir);
  } catch (err) {
    console.error(
      pc.red(err instanceof Error ? err.message : String(err)),
    );
    process.exit(1);
  }

  const target = resolveExportTarget(options?.target, config) as ExportTarget;

  const result = await validateCourse({ courseDir, target });
  printValidationResult(result.issues, result.manifest, result.ok);
}
