/** Minimal activity list for xAPI/cmi5 packaging (no Node deps). */
export interface CourseActivity {
  id: string;
  title: string;
  kind: "lesson" | "assessment";
}

export interface ManifestWithActivities {
  title: string;
  description?: string;
  lessons: Array<{ id: string; title?: string }>;
  assessments?: Array<{ id: string }>;
  tracking?: {
    xapi?: {
      displayName?: string;
    };
  };
}

export function listManifestActivities(
  manifest: ManifestWithActivities,
): CourseActivity[] {
  const activities: CourseActivity[] = manifest.lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title ?? lesson.id,
    kind: "lesson" as const,
  }));
  for (const ref of manifest.assessments ?? []) {
    activities.push({
      id: ref.id,
      title: ref.id.replace(/_/g, " "),
      kind: "assessment",
    });
  }
  return activities;
}
