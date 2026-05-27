import { existsSync, realpathSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { assertResolvedPathContained, isPathContained } from "@lxpack/validators";

/** Resolve build output file/dir; must stay inside the course directory (symlink-safe). */
export function resolveBuildOutputPath(
  courseDir: string,
  outputPath: string,
): string {
  const root = realpathSync(resolve(courseDir));
  const target =
    outputPath.startsWith("/") || /^[a-zA-Z]:\\/.test(outputPath)
      ? resolve(outputPath)
      : resolve(root, outputPath);

  const parentDir = dirname(target);
  const effectiveTarget = existsSync(target)
    ? realpathSync(target)
    : existsSync(parentDir)
      ? resolve(realpathSync(parentDir), basename(target))
      : target;

  if (!isPathContained(root, effectiveTarget)) {
    throw new Error("Output path must stay inside the course directory");
  }
  if (existsSync(target)) {
    const contained = assertResolvedPathContained(root, target);
    if (!contained.ok) {
      throw new Error("Output path must stay inside the course directory");
    }
  }
  return target;
}

