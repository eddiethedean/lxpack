import { posix, resolve } from "node:path";
import { assertResolvedPathContained } from "@lxpack/validators";

const COURSE_PREFIX = "/course/";

/** True when `..` segments would resolve above the course root. */
export function coursePathEscapesRoot(rel: string): boolean {
  let depth = 0;
  for (const segment of rel.split("/")) {
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
  if (coursePathEscapesRoot(raw)) {
    return null;
  }
  let rel = posix.normalize(raw);
  if (rel.startsWith("/")) {
    rel = rel.slice(1);
  }
  if (rel === ".." || rel.startsWith("../")) {
    return null;
  }
  return rel;
}

/** Block rules on a normalized course-relative path. */
export function isPreviewBlockedCourseRel(rel: string): boolean {
  if (rel.startsWith("assessments/")) {
    return true;
  }
  if (
    rel === "course.yaml" ||
    rel === "lxpack.config.json" ||
    rel === "lxpack.config.ts"
  ) {
    return true;
  }
  if (rel.startsWith(".lxpack/") || rel === ".lxpack") {
    return true;
  }
  for (const segment of rel.split("/")) {
    if (segment.startsWith(".")) {
      return true;
    }
  }
  return false;
}

/** Paths under /course/ that must not be served during preview. */
export function isPreviewBlockedCoursePath(urlPath: string): boolean {
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
  return isPreviewBlockedCourseRel(rel);
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
): boolean {
  return (
    isPreviewBlockedCoursePath(urlPath) ||
    isPreviewCoursePathEscaping(courseDir, urlPath)
  );
}
