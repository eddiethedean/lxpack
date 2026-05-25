import { existsSync, realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { z } from "zod";
import {
  assertResolvedPathContained,
  formatErrorMessage,
  isPathContained,
} from "@lxpack/validators";

const lxpackConfigSchema = z
  .object({
    exports: z
      .object({
        defaultTarget: z
          .enum(["scorm12", "scorm2004", "standalone", "xapi", "cmi5"])
          .optional(),
      })
      .optional(),
    preview: z
      .object({
        scormMode: z.enum(["local", "scorm12", "scorm2004"]).optional(),
      })
      .strict()
      .optional(),
    xapi: z
      .object({
        preview: z
          .object({
            logStatements: z.boolean().optional(),
            mockLrs: z.boolean().optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    output: z
      .object({
        dir: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export type LxpackConfig = z.infer<typeof lxpackConfigSchema>;

export async function loadLxpackConfig(
  courseDir: string,
): Promise<LxpackConfig | null> {
  const configPath = join(courseDir, "lxpack.config.json");
  if (!existsSync(configPath)) return null;

  const contained = assertResolvedPathContained(courseDir, configPath);
  if (!contained.ok) {
    throw new Error(
      `lxpack.config.json: ${contained.message}`,
    );
  }

  try {
    const content = await readFile(configPath, "utf-8");
    const raw = JSON.parse(content) as unknown;
    const parsed = lxpackConfigSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues.map((i) => i.message).join("; "),
      );
    }
    return parsed.data;
  } catch (err) {
    throw new Error(
      `Failed to load lxpack.config.json: ${formatErrorMessage(err)}`,
    );
  }
}

/** Resolve init/build output path relative to cwd; blocks `..` traversal. */
export function resolvePathInCwd(relativePath: string): string {
  const cwd = resolve(process.cwd());
  if (relativePath.startsWith("/") || /^[a-zA-Z]:\\/.test(relativePath)) {
    throw new Error(
      "Use a relative path for the output directory (must stay inside the current working directory)",
    );
  }
  const target = resolve(cwd, relativePath);
  if (!isPathContained(cwd, target)) {
    throw new Error("Path must be inside the current working directory");
  }
  return target;
}

/** Resolve output dir relative to course root; must stay inside course (symlink-safe). */
export function resolveOutputDir(courseDir: string, outputDir: string): string {
  const root = realpathSync(resolve(courseDir));
  const target = resolve(root, outputDir);
  if (!isPathContained(root, target)) {
    throw new Error(
      "output.dir in lxpack.config.json must stay inside the course directory",
    );
  }
  if (existsSync(target)) {
    const contained = assertResolvedPathContained(root, target);
    if (!contained.ok) {
      throw new Error(
        "output.dir in lxpack.config.json must stay inside the course directory",
      );
    }
  }
  return target;
}

/** Resolve build output file/dir; must stay inside the course directory. */
export function resolveBuildOutputPath(
  courseDir: string,
  outputPath: string,
): string {
  const root = realpathSync(resolve(courseDir));
  const target =
    outputPath.startsWith("/") || /^[a-zA-Z]:\\/.test(outputPath)
      ? resolve(outputPath)
      : resolve(root, outputPath);

  const parentDir = dirname(target);
  const effectiveTarget = existsSync(target)
    ? realpathSync(target)
    : existsSync(parentDir)
      ? resolve(realpathSync(parentDir), basename(target))
      : target;

  if (!isPathContained(root, effectiveTarget)) {
    throw new Error("Output path must stay inside the course directory");
  }
  if (existsSync(target)) {
    const contained = assertResolvedPathContained(root, target);
    if (!contained.ok) {
      throw new Error("Output path must stay inside the course directory");
    }
  }
  return target;
}
