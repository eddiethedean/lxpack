import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { packageCourse, packageStandaloneDir } from "@lxpack/scorm";
import type { ExportTarget } from "@lxpack/scorm";
import { validateCourse } from "@lxpack/validators";
import pc from "picocolors";
import {
  findCourseDir,
  loadCourseManifest,
  loadLxpackConfig,
  readRuntimeBundle,
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
  if (!validation.valid) {
    console.error(pc.red("Cannot build: course validation failed"));
    for (const issue of validation.issues) {
      console.error(`  ${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }

  const manifest = await loadCourseManifest(courseDir);
  const { clientJs, css } = await readRuntimeBundle();

  const slug = manifest.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "course";

  const outputBase = config?.output?.dir ?? ".lxpack";
  await mkdir(join(courseDir, outputBase), { recursive: true });

  if (options.dir) {
    const outputDir =
      options.output ?? join(courseDir, outputBase, target);
    const result = await packageStandaloneDir({
      courseDir,
      manifest,
      outputDir,
      target,
      runtimeClientJs: clientJs,
      runtimeCss: css,
    });
    console.log(pc.green(`✓ Built ${target} package`));
    console.log(`  Output: ${result.outputDir}`);
    console.log(`  Files: ${result.fileCount}`);
  } else {
    const defaultName =
      target === "standalone" ? `${slug}-standalone.zip` : `${slug}-scorm12.zip`;
    const outputPath =
      options.output ?? join(courseDir, outputBase, defaultName);

    const result = await packageCourse({
      courseDir,
      manifest,
      outputPath,
      target,
      runtimeClientJs: clientJs,
      runtimeCss: css,
    });

    console.log(pc.green(`✓ Built ${target} package`));
    console.log(`  Output: ${result.outputPath}`);
    console.log(`  Files: ${result.fileCount}`);
  }
}
