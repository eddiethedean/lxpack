import {
  validateCourse,
  buildRuntimeAssessmentBundleFromParsed,
  type CourseManifest,
  type RuntimeAssessmentBundle,
  type ValidationResult,
} from "@lxpack/validators";

export interface ValidatedCourseContext {
  courseDir: string;
  validation: ValidationResult;
  manifest: CourseManifest;
  assessmentBundle: RuntimeAssessmentBundle;
}

export async function loadValidatedCourseContext(
  courseDir: string,
): Promise<ValidatedCourseContext | null> {
  const validation = await validateCourse(courseDir);
  if (!validation.valid || !validation.manifest) {
    return null;
  }

  const parsed = validation.parsedAssessments ?? new Map();
  const assessmentBundle = buildRuntimeAssessmentBundleFromParsed(parsed);

  return {
    courseDir,
    validation,
    manifest: validation.manifest,
    assessmentBundle,
  };
}

export function printValidationIssues(validation: ValidationResult): void {
  for (const issue of validation.issues) {
    console.error(`  ${issue.path}: ${issue.message}`);
  }
}
