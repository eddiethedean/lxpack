import type { CourseManifest } from "@lxpack/validators";

export interface CourseActivity {
  id: string;
  title: string;
  kind: "lesson" | "assessment";
}

export function listCourseActivities(manifest: CourseManifest): CourseActivity[] {
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
