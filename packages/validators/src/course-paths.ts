import { realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

export function isPathContained(rootDir: string, candidatePath: string): boolean {
  const root = resolve(rootDir);
  const candidate = resolve(candidatePath);
  const rel = relative(root, candidate);
  if (rel === "") return true;
  return !rel.startsWith("..") && !isAbsolute(rel);
}

export function resolveCoursePath(
  courseDir: string,
  relativePath: string,
): { ok: true; path: string } | { ok: false; message: string } {
  if (relativePath.startsWith("/") || /^[a-zA-Z]:\\/.test(relativePath)) {
    return { ok: false, message: "Absolute paths are not allowed" };
  }

  const resolvedDir = resolve(courseDir);
  const resolvedPath = resolve(resolvedDir, relativePath);

  if (!isPathContained(resolvedDir, resolvedPath)) {
    return { ok: false, message: "Path escapes course directory" };
  }

  return { ok: true, path: resolvedPath };
}

export function assertResolvedPathContained(
  courseDir: string,
  resolvedPath: string,
): { ok: true } | { ok: false; message: string } {
  try {
    const root = realpathSync(resolve(courseDir));
    const target = realpathSync(resolvedPath);
    if (!isPathContained(root, target)) {
      return { ok: false, message: "Path escapes course directory" };
    }
    return { ok: true };
  /* v8 ignore start -- broken symlinks or missing realpath targets */
  } catch {
    return { ok: false, message: "Path could not be resolved" };
  }
  /* v8 ignore end */
}
