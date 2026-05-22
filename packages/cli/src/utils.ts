import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import type { CourseManifest } from "@lxpack/validators";
import { loadManifest } from "@lxpack/validators";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  return resolve(__dirname, "../../runtime/dist");
}

export async function readRuntimeBundle(): Promise<{
  clientJs: string;
  css: string;
}> {
  const assetsDir = getRuntimeAssetsDir();
  const [clientJs, css] = await Promise.all([
    readFile(join(assetsDir, "client.js"), "utf-8"),
    readFile(join(assetsDir, "../src/styles.css"), "utf-8").catch(() =>
      readFile(join(assetsDir, "styles.css"), "utf-8").catch(
        () => getEmbeddedStyles(),
      ),
    ),
  ]);
  return { clientJs, css };
}

function getEmbeddedStyles(): string {
  return `:root { --lxpack-bg: #0f1419; } body { margin: 0; }`;
}

export interface LxpackConfig {
  runtime?: { theme?: string };
  exports?: {
    scorm12?: boolean;
    scorm2004?: boolean;
    xapi?: boolean;
    standalone?: boolean;
  };
}

export async function loadLxpackConfig(
  courseDir: string,
): Promise<LxpackConfig | null> {
  const configPath = join(courseDir, "lxpack.config.ts");
  if (!existsSync(configPath)) return null;
  return {};
}

export async function loadCourseYamlRaw(
  courseDir: string,
): Promise<CourseManifest> {
  const content = await readFile(join(courseDir, "course.yaml"), "utf-8");
  return parseYaml(content) as CourseManifest;
}
