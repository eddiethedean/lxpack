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
import {
  loadValidatedCourseContext,
  printValidationIssues,
} from "../lib/validated-course.js";
import { getDirPackager, getZipPackager } from "../packagers/index.js";
import { validateCourse, validateXapiTracking } from "@lxpack/validators";
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
  const config = await loadLxpackConfig(courseDir);
  const target = (options.target ??
    config?.exports?.defaultTarget ??
    "scorm12") as ExportTarget;

  if (!isValidExportTarget(target)) {
    console.error(pc.red(formatInvalidTargetMessage(target)));
    process.exit(1);
  }

  const ctx = await loadValidatedCourseContext(courseDir);
  if (!ctx) {
    console.error(pc.red("Cannot build: course validation failed"));
    const validation = await validateCourse(courseDir);
    printValidationIssues(validation);
    process.exit(1);
  }

  const { manifest, assessmentBundle } = ctx;

  if (target === "xapi" || target === "cmi5") {
    const xapiIssues = validateXapiTracking(manifest);
    if (xapiIssues.length > 0) {
      console.error(pc.red("Cannot build: course validation failed"));
      for (const issue of xapiIssues) {
        console.error(`  ${issue.path}: ${issue.message}`);
      }
      process.exit(1);
    }
  }
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

  if (options.dir) {
    const outputDir =
      options.output ?? join(outputRoot, target);
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
    const outputPath = options.output ?? join(outputRoot, defaultName);

    const result = await getZipPackager(target).package({
      ...packageOptions,
      outputPath,
    });

    console.log(pc.green(`✓ Built ${target} package`));
    console.log(`  Output: ${result.outputPath}`);
    console.log(`  Files: ${result.fileCount}`);
  }
}
