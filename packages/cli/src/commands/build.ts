import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { courseSlug, type ExportTarget } from "@lxpack/scorm";
import pc from "picocolors";
import {
  findCourseDir,
  loadLxpackConfig,
  readComponentsBundle,
  readRuntimeBundle,
  resolveOutputDir,
} from "../utils.js";
import { resolveBuildOutputPath } from "../lib/lxpack-config.js";
import {
  loadValidatedCourseContext,
  printValidationIssues,
} from "../lib/validated-course.js";
import { getDirPackager, getZipPackager } from "../packagers/index.js";
import { formatErrorMessage, validateCourse } from "@lxpack/validators";
import { CoursePackagingError } from "@lxpack/scorm";
import {
  formatInvalidTargetMessage,
  isValidExportTarget,
} from "../lib/targets.js";

export async function buildCommand(options: {
  target?: string;
  output?: string;
  dir?: boolean;
}): Promise<void> {
  const courseDir = findCourseDir();

  let config;
  try {
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

  const ctx = await loadValidatedCourseContext(courseDir, { exportTarget: target });
  if (!ctx) {
    console.error(pc.red("Cannot build: course validation failed"));
    const validation = await validateCourse(courseDir, { exportTarget: target });
    printValidationIssues(validation);
    process.exit(1);
  }

  const { manifest, assessmentBundle } = ctx;
  const [{ clientJs, css }, componentsBundleJs] = await Promise.all([
    readRuntimeBundle(),
    readComponentsBundle(),
  ]);

  const slug = courseSlug(manifest);

  const outputBase = config?.output?.dir ?? ".lxpack";
  const outputRoot = resolveOutputDir(courseDir, outputBase);
  await mkdir(outputRoot, { recursive: true });

  const packageOptions = {
    courseDir,
    manifest,
    target,
    runtimeClientJs: clientJs,
    runtimeCss: css,
    componentsBundleJs,
    assessmentBundle,
  };

  try {
    if (options.dir) {
      const outputDir = options.output
        ? resolveBuildOutputPath(courseDir, options.output)
        : join(outputRoot, target);
      const result = await getDirPackager(target).package({
        ...packageOptions,
        outputDir,
      });
      console.log(pc.green(`✓ Built ${target} package`));
      console.log(`  Output: ${result.outputDir}`);
      console.log(`  Files: ${result.fileCount}`);
    } else {
      const defaultName =
        target === "standalone"
          ? `${slug}-standalone.zip`
          : target === "scorm2004"
            ? `${slug}-scorm2004.zip`
            : target === "xapi"
              ? `${slug}-xapi.zip`
              : target === "cmi5"
                ? `${slug}-cmi5.zip`
                : `${slug}-scorm12.zip`;
      const outputPath = options.output
        ? resolveBuildOutputPath(courseDir, options.output)
        : join(outputRoot, defaultName);

      const result = await getZipPackager(target).package({
        ...packageOptions,
        outputPath,
      });

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
