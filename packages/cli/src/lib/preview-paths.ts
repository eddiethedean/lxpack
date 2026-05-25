/** Paths under /course/ that must not be served during preview. */
export function isPreviewBlockedCoursePath(urlPath: string): boolean {
  const path = urlPath.split("?")[0] ?? "";
  if (!path.startsWith("/course/")) {
    return false;
  }
  const rel = path.slice("/course/".length);
  if (rel.startsWith("assessments/")) {
    return true;
  }
  if (rel === "course.yaml" || rel === "lxpack.config.json") {
    return true;
  }
  if (rel.startsWith(".lxpack/") || rel === ".lxpack") {
    return true;
  }
  return false;
}
