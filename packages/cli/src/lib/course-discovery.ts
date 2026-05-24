import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { CourseManifest } from "@lxpack/validators";
import { loadManifest } from "@lxpack/validators";

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
