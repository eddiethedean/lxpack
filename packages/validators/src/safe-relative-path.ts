/** POSIX-style relative path with no `..` or absolute segments. */
export function normalizeCourseRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/");
}

/** Safe relative path for course assets (lessons, assessments, interactions). */
export function validateSafeRelativePath(path: string): string | null {
  const normalized = normalizeCourseRelativePath(path);
  if (/["'<>]/.test(normalized) || /\s/.test(normalized)) {
    return "Path contains invalid characters (quotes, angle brackets, or whitespace)";
  }
  if (normalized.includes("..")) {
    return "Path must not contain '..' segments";
  }
  if (normalized.startsWith("/")) {
    return "Absolute paths are not allowed";
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/.test(normalized)) {
    return "Path must start with a letter and use only letters, numbers, /, _, ., and -";
  }
  return null;
}

/** Assessment YAML must live under assessments/ (author-only; not shipped as static files). */
export function validateAssessmentFilePath(file: string): string | null {
  const base = validateSafeRelativePath(file);
  if (base) return base;
  const normalized = normalizeCourseRelativePath(file);
  if (!normalized.startsWith("assessments/")) {
    return "Assessment file must be under assessments/ (e.g. assessments/quiz.yaml)";
  }
  const rest = normalized.slice("assessments/".length);
  if (!rest || rest.endsWith("/")) {
    return "Assessment file must be a file under assessments/";
  }
  return null;
}
