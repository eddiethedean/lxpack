import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import { z } from "zod";
import type { CourseManifest } from "@lxpack/validators";
import {
  loadManifest,
  formatErrorMessage,
  isPathContained,
} from "@lxpack/validators";

const require = createRequire(import.meta.url);

export function findCourseDir(startDir = process.cwd()): string {
  let dir = resolve(startDir);
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, "course.yaml"))) {
      return dir;
    }
    dir = dirname(dir);
  }
  throw new Error(
    "No course.yaml found. Run from a course directory or use lxpack init.",
  );
}

export async function loadCourseManifest(
  courseDir: string,
): Promise<CourseManifest> {
  const loaded = await loadManifest(courseDir);
  if (Array.isArray(loaded)) {
    throw new Error(loaded.map((i) => i.message).join("; "));
  }
  return loaded.manifest;
}

export function getRuntimeAssetsDir(): string {
  return dirname(require.resolve("@lxpack/runtime/client"));
}

export function getEmbeddedStyles(): string {
  return `:root { --lxpack-bg: #0f1419; } body { margin: 0; }`;
}

export async function loadRuntimeStyles(assetsDir: string): Promise<string> {
  try {
    return await readFile(join(assetsDir, "styles.css"), "utf-8");
  } catch {
    return getEmbeddedStyles();
  }
}

export async function readRuntimeBundle(
  assetsDir = getRuntimeAssetsDir(),
): Promise<{
  clientJs: string;
  css: string;
}> {
  const clientPath = join(assetsDir, "client.js");

  if (!existsSync(clientPath)) {
    throw new Error(
      "Runtime bundle not found. Run `pnpm build` from the LXPack repo root, or reinstall @lxpack/runtime.",
    );
  }

  const [clientJs, css] = await Promise.all([
    readFile(clientPath, "utf-8"),
    loadRuntimeStyles(assetsDir),
  ]);

  if (clientJs.includes('from "./runtime.js"')) {
    throw new Error(
      "Runtime client bundle is not self-contained. Rebuild @lxpack/runtime with `pnpm build`.",
    );
  }

  return { clientJs, css };
}

export async function readComponentsBundle(): Promise<string | undefined> {
  try {
    const bundlePath = require.resolve("@lxpack/components/bundle");
    return await readFile(bundlePath, "utf-8");
  } catch {
    return undefined;
  }
}

const lxpackConfigSchema = z
  .object({
    exports: z
      .object({
        defaultTarget: z
          .enum(["scorm12", "scorm2004", "standalone"])
          .optional(),
      })
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

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatCourseTitleForYaml(title: string): string {
  const doc = { title, version: "1.0.0" };
  const yaml = stringifyYaml(doc);
  const titleLine = yaml.split("\n").find((l) => l.startsWith("title:"));
  if (!titleLine) {
    return JSON.stringify(title);
  }
  return titleLine.replace(/^title:\s*/, "");
}

export function getCliVersion(): string {
  const pkg = require("../package.json") as { version: string };
  return pkg.version;
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
