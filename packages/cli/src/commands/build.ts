import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { packageCourse, packageStandaloneDir, courseSlug } from "@lxpack/scorm";
import type { ExportTarget } from "@lxpack/scorm";
import {
  validateCourse,
  buildRuntimeAssessmentBundle,
} from "@lxpack/validators";
import pc from "picocolors";
import {
  findCourseDir,
  loadLxpackConfig,
  readRuntimeBundle,
  resolveOutputDir,
} from "../utils.js";

const VALID_TARGETS: ExportTarget[] = ["scorm12", "standalone"];

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

  if (!VALID_TARGETS.includes(target)) {
    console.error(
      pc.red(
        `Invalid target: ${target}. Valid targets: ${VALID_TARGETS.join(", ")}`,
      ),
    );
    process.exit(1);
  }

  const validation = await validateCourse(courseDir);
  if (!validation.valid || !validation.manifest) {
    console.error(pc.red("Cannot build: course validation failed"));
    for (const issue of validation.issues) {
      console.error(`  ${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }

  const manifest = validation.manifest;
  const assessmentBundle = await buildRuntimeAssessmentBundle(
    courseDir,
    manifest,
  );
  const { clientJs, css } = await readRuntimeBundle();

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
    assessmentBundle,
  };

  if (options.dir) {
    const outputDir =
      options.output ?? join(outputRoot, target);
    const result = await packageStandaloneDir({
      ...packageOptions,
      outputDir,
    });
    console.log(pc.green(`✓ Built ${target} package`));
    console.log(`  Output: ${result.outputDir}`);
    console.log(`  Files: ${result.fileCount}`);
  } else {
    const defaultName =
      target === "standalone" ? `${slug}-standalone.zip` : `${slug}-scorm12.zip`;
    const outputPath = options.output ?? join(outputRoot, defaultName);

    const result = await packageCourse({
      ...packageOptions,
      outputPath,
    });

    console.log(pc.green(`✓ Built ${target} package`));
    console.log(`  Output: ${result.outputPath}`);
    console.log(`  Files: ${result.fileCount}`);
  }
}
