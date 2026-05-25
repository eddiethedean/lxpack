import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import { formatErrorMessage, isPathContained } from "@lxpack/validators";

const lxpackConfigSchema = z
  .object({
    exports: z
      .object({
        defaultTarget: z
          .enum(["scorm12", "scorm2004", "standalone", "xapi", "cmi5"])
          .optional(),
      })
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

/** Resolve output dir relative to course root; must stay inside course. */
export function resolveOutputDir(courseDir: string, outputDir: string): string {
  const root = resolve(courseDir);
  const target = resolve(root, outputDir);
  if (!isPathContained(root, target)) {
    throw new Error("output.dir in lxpack.config.json must stay inside the course directory");
  }
  return target;
}
