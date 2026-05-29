import { packageLessonkit, buildCourse } from "@lxpack/api";
import type { ExportTarget } from "@lxpack/scorm";
import pc from "picocolors";
import { findCourseDir, loadLxpackConfig } from "../utils.js";
import { printValidationIssues } from "../lib/validated-course.js";
import { resolveBuildOutputPath } from "../lib/lxpack-config.js";
import { formatErrorMessage } from "@lxpack/validators";
import { CoursePackagingError } from "@lxpack/scorm";
import {
  formatInvalidTargetMessage,
  isValidExportTarget,
} from "../lib/targets.js";
import {
  buildSpaDirsFromInterchange,
  loadLessonkitInterchangeFile,
  parseSpaLessonOption,
} from "../lib/lessonkit-build.js";

export async function buildCommand(options: {
  target?: string;
  output?: string;
  dir?: boolean;
  lessonkit?: string;
  spaLesson?: string[];
  spaDist?: string;
}): Promise<void> {
  let config;
  try {
    const courseDir = options.lessonkit ? process.cwd() : findCourseDir();
    config = await loadLxpackConfig(courseDir);
  } catch (err) {
    console.error(pc.red(formatErrorMessage(err)));
    process.exit(1);
  }

  const target = (options.target ??
    config?.exports?.defaultTarget ??
    "scorm12") as ExportTarget;

  if (!isValidExportTarget(target)) {
    console.error(pc.red(formatInvalidTargetMessage(target)));
    process.exit(1);
  }

  try {
    if (options.lessonkit) {
      const loaded = await loadLessonkitInterchangeFile(options.lessonkit);
      if (!loaded.ok) {
        console.error(pc.red("Cannot build: invalid lessonkit interchange"));
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

      const spaLessons = (options.spaLesson ?? []).map(parseSpaLessonOption);
      const spaDirs = buildSpaDirsFromInterchange(
        loaded.data,
        spaLessons,
        options.spaDist,
      );

      const result = await packageLessonkit({
        interchange: loaded.data,
        spaDirs,
        target,
        dir: options.dir,
        ...(options.output ? { output: options.output } : {}),
        outputBaseDir: config?.output?.dir ?? ".lxpack",
        assessments: loaded.data.assessments,
      });

      if (!result.ok) {
        console.error(pc.red("Cannot build: course validation failed"));
        printValidationIssues({ valid: false, issues: result.issues });
        process.exit(1);
      }

      console.log(pc.green(`✓ Built ${target} package (LessonKit interchange)`));
      if (result.outputDir) {
        console.log(`  Output: ${result.outputDir}`);
      } else {
        console.log(`  Output: ${result.outputPath}`);
      }
      console.log(`  Files: ${result.fileCount}`);
      console.log(`  Staging: ${result.courseDir}`);
      return;
    }

    const courseDir = findCourseDir();

    if (options.dir) {
      const outputDir = options.output
        ? resolveBuildOutputPath(courseDir, options.output)
        : undefined;
      const result = await buildCourse({
        courseDir,
        target,
        dir: true,
        ...(outputDir ? { output: outputDir } : {}),
        outputBaseDir: config?.output?.dir ?? ".lxpack",
      });
      if (!result.ok) {
        console.error(pc.red("Cannot build: course validation failed"));
        printValidationIssues({ valid: false, issues: result.issues });
        process.exit(1);
      }
      console.log(pc.green(`✓ Built ${target} package`));
      console.log(`  Output: ${result.outputDir}`);
      console.log(`  Files: ${result.fileCount}`);
    } else {
      const outputPath = options.output
        ? resolveBuildOutputPath(courseDir, options.output)
        : undefined;
      const result = await buildCourse({
        courseDir,
        target,
        dir: false,
        ...(outputPath ? { output: outputPath } : {}),
        outputBaseDir: config?.output?.dir ?? ".lxpack",
      });
      if (!result.ok) {
        console.error(pc.red("Cannot build: course validation failed"));
        printValidationIssues({ valid: false, issues: result.issues });
        process.exit(1);
      }

      console.log(pc.green(`✓ Built ${target} package`));
      console.log(`  Output: ${result.outputPath}`);
      console.log(`  Files: ${result.fileCount}`);
    }
  } catch (err) {
    if (err instanceof CoursePackagingError) {
      console.error(pc.red(`Cannot build: ${err.message}`));
      process.exit(1);
    }
    throw err;
  }
}
