import type { CourseManifest } from "@lxpack/validators";

/** Stable slug for ZIP filenames and SCORM identifiers. */
export function courseSlug(manifest: CourseManifest): string {
  const slug = manifest.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug) return slug;

  let hash = 0;
  const key = `${manifest.title}::${manifest.version}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return `course-${Math.abs(hash).toString(36)}`;
}
