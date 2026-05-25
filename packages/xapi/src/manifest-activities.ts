import {
  enumerateActivities,
  type CourseActivity,
  type CourseManifest,
} from "@lxpack/validators";

export type { CourseActivity };

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
  return enumerateActivities(manifest as CourseManifest);
}
