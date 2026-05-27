import { posix, resolve } from "node:path";
import type { CourseManifest } from "@lxpack/validators";
import {
  assertResolvedPathContained,
  isPackagablePathAliasBlocked,
} from "@lxpack/validators";

const COURSE_PREFIX = "/course/";

const STATIC_BLOCKED_RELS = [
  "course.yaml",
  "lxpack.config.json",
  "lxpack.config.ts",
  "lessonkit.json",
  "lxpack.import.json",
] as const;

/** Build case-insensitive blocked relative paths for preview static serving. */
export function buildPreviewBlockedRels(
  manifest?: CourseManifest,
): Set<string> {
  const blocked = new Set<string>(STATIC_BLOCKED_RELS);
  for (const ref of manifest?.assessments ?? []) {
    blocked.add(ref.file.replace(/\\/g, "/"));
  }
  return blocked;
}

/** True when `..` segments would resolve above the course root. */
export function coursePathEscapesRoot(rel: string): boolean {
  const normalized = rel.replace(/\\/g, "/");
  let depth = 0;
  for (const segment of normalized.split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    }
    if (segment === "..") {
      depth -= 1;
      if (depth < 0) {
        return true;
      }
    } else {
      depth += 1;
    }
  }
  return false;
}

/** Decode percent-encoding (up to two passes for double-encoding). */
export function decodeCourseUrlPath(encoded: string): string | null {
  if (/%(?![0-9A-Fa-f]{2})/.test(encoded)) {
    return null;
  }
  let current = encoded;
  for (let pass = 0; pass < 2; pass++) {
    if (!/%[0-9A-Fa-f]{2}/.test(current)) {
      return current;
    }
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) {
        return current;
      }
      current = decoded;
    } catch {
      return null;
    }
  }
  return current;
}

/** Normalize the path segment after `/course/` (posix, collapse `..`). */
export function normalizeCourseRelPath(urlPath: string): string | null {
  const path = urlPath.split("?")[0] ?? "";
  if (!path.startsWith(COURSE_PREFIX)) {
    return null;
  }
  const rawEncoded = path.slice(COURSE_PREFIX.length);
  if (!rawEncoded) {
    return "";
  }
  const raw = decodeCourseUrlPath(rawEncoded);
  if (raw === null) {
    return null;
  }
  if (raw.includes("\0")) {
    return null;
  }
  const posixRaw = raw.replace(/\\/g, "/");
  if (coursePathEscapesRoot(posixRaw)) {
    return null;
  }
  let rel = posix.normalize(posixRaw);
  if (rel.startsWith("/")) {
    rel = rel.slice(1);
  }
  if (rel === ".." || rel.startsWith("../")) {
    return null;
  }
  return rel;
}

function relMatchesBlockedSet(
  rel: string,
  blockedRels: ReadonlySet<string>,
): boolean {
  const normalized = rel.replace(/\\/g, "/");
  const lower = normalized.toLowerCase();
  for (const blocked of blockedRels) {
    if (lower === blocked.toLowerCase()) {
      return true;
    }
  }
  return false;
}

/** Block rules on a normalized course-relative path. */
export function isPreviewBlockedCourseRel(
  rel: string,
  blockedRels: ReadonlySet<string> = buildPreviewBlockedRels(),
): boolean {
  const normalized = rel.replace(/\\/g, "/");
  const lower = normalized.toLowerCase();

  if (relMatchesBlockedSet(normalized, blockedRels)) {
    return true;
  }
  if (lower.startsWith("assessments/")) {
    return true;
  }
  if (lower.startsWith(".lxpack/") || lower === ".lxpack") {
    return true;
  }
  if (lower === "node_modules" || lower.startsWith("node_modules/")) {
    return true;
  }
  for (const segment of normalized.split("/")) {
    if (segment.startsWith(".")) {
      return true;
    }
  }
  return false;
}

/** Paths under /course/ that must not be served during preview. */
export function isPreviewBlockedCoursePath(
  urlPath: string,
  blockedRels?: ReadonlySet<string>,
): boolean {
  const path = urlPath.split("?")[0] ?? "";
  if (!path.startsWith(COURSE_PREFIX)) {
    return false;
  }
  const rel = normalizeCourseRelPath(urlPath);
  if (rel === null) {
    return true;
  }
  if (rel === "") {
    return false;
  }
  return isPreviewBlockedCourseRel(rel, blockedRels ?? buildPreviewBlockedRels());
}

/** True when the resolved filesystem path would escape the course directory. */
export function isPreviewCoursePathEscaping(
  courseDir: string,
  urlPath: string,
): boolean {
  const path = urlPath.split("?")[0] ?? "";
  if (!path.startsWith(COURSE_PREFIX)) {
    return false;
  }
  const rel = normalizeCourseRelPath(urlPath);
  if (rel === null) {
    return true;
  }
  if (!rel) {
    return false;
  }
  const resolved = resolve(courseDir, rel);
  const contained = assertResolvedPathContained(courseDir, resolved);
  return !contained.ok;
}

export function shouldBlockPreviewCourseRequest(
  courseDir: string,
  urlPath: string,
  blockedRels?: ReadonlySet<string>,
): boolean {
  if (isPreviewBlockedCoursePath(urlPath, blockedRels)) {
    return true;
  }
  if (isPreviewCoursePathEscaping(courseDir, urlPath)) {
    return true;
  }
  const path = urlPath.split("?")[0] ?? "";
  if (!path.startsWith(COURSE_PREFIX)) {
    return false;
  }
  const rel = normalizeCourseRelPath(urlPath);
  if (rel === null) {
    return true;
  }
  if (rel === "") {
    return false;
  }
  const resolved = resolve(courseDir, rel);
  return isPackagablePathAliasBlocked(courseDir, resolved, rel);
}
