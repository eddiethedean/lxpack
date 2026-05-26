import { lstatSync, realpathSync } from "node:fs";
import { relative, resolve } from "node:path";
import { assertResolvedPathContained } from "./course-paths.js";

const SENSITIVE_ROOT_FILES = new Set([
  "course.yaml",
  "lxpack.config.json",
  "lxpack.config.ts",
]);

/** Normalize a course-relative path for policy checks. */
export function normalizeLogicalCourseRel(rel: string): string {
  return rel.replace(/\\/g, "/").replace(/^\.\//, "");
}

function normalizeRelLower(rel: string): string {
  return normalizeLogicalCourseRel(rel).toLowerCase();
}

/** True when the course-relative path points at author-only or manifest content. */
export function isSensitiveCourseRel(rel: string): boolean {
  const normalized = normalizeRelLower(rel);
  if (normalized.startsWith("assessments/")) {
    return true;
  }
  if (normalized.startsWith(".lxpack/") || normalized === ".lxpack") {
    return true;
  }
  if (SENSITIVE_ROOT_FILES.has(normalized)) {
    return true;
  }
  for (const segment of normalized.split("/")) {
    if (segment.startsWith(".")) {
      return true;
    }
  }
  return false;
}

/** Whether a logical path may resolve to a sensitive target (e.g. assessments via manifest). */
export function isLogicalPathAllowedForTarget(
  logicalRel: string,
  targetRel: string,
): boolean {
  const logical = normalizeRelLower(logicalRel);
  const target = normalizeRelLower(targetRel);
  if (target.startsWith("assessments/")) {
    return logical.startsWith("assessments/");
  }
  if (SENSITIVE_ROOT_FILES.has(target)) {
    return logical === target;
  }
  if (target.startsWith(".lxpack/") || target === ".lxpack") {
    return logical.startsWith(".lxpack/") || logical === ".lxpack";
  }
  for (const segment of target.split("/")) {
    if (segment.startsWith(".")) {
      return logical === target;
    }
  }
  return !isSensitiveCourseRel(target);
}

export function courseRelativeFromRoot(
  courseDir: string,
  absolutePath: string,
): string | null {
  try {
    const root = realpathSync(resolve(courseDir));
    const target = realpathSync(absolutePath);
    const rel = relative(root, target).replace(/\\/g, "/");
    if (rel.startsWith("..") || rel.includes("..")) {
      return null;
    }
    return rel;
  } catch {
    return null;
  }
}

export function assertPackagableFile(
  courseDir: string,
  resolvedPath: string,
  logicalRel: string,
): { ok: true } | { ok: false; message: string } {
  const contained = assertResolvedPathContained(courseDir, resolvedPath);
  if (!contained.ok) {
    return contained;
  }

  let stat;
  try {
    stat = lstatSync(resolvedPath);
  } catch {
    return { ok: false, message: "Path could not be resolved" };
  }

  if (stat.isSymbolicLink()) {
    return {
      ok: false,
      message: `Symlink not allowed: ${normalizeLogicalCourseRel(logicalRel)}`,
    };
  }

  if (stat.isFile() && stat.nlink > 1) {
    return {
      ok: false,
      message: `Hard link not allowed: ${normalizeLogicalCourseRel(logicalRel)}`,
    };
  }

  const targetRel = courseRelativeFromRoot(courseDir, resolvedPath);
  if (targetRel === null) {
    return { ok: false, message: "Path could not be resolved" };
  }

  if (
    isSensitiveCourseRel(targetRel) &&
    !isLogicalPathAllowedForTarget(logicalRel, targetRel)
  ) {
    return {
      ok: false,
      message: `Path alias resolves to restricted location (${targetRel}): ${normalizeLogicalCourseRel(logicalRel)}`,
    };
  }

  return { ok: true };
}

/** Preview/static: block when URL path aliases to sensitive realpath. */
export function isPackagablePathAliasBlocked(
  courseDir: string,
  resolvedAbsolutePath: string,
  logicalRel: string,
): boolean {
  const check = assertPackagableFile(courseDir, resolvedAbsolutePath, logicalRel);
  return !check.ok;
}
