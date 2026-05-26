import { join } from "node:path";
import type { ExportTarget } from "@lxpack/scorm";
import { REPO_ROOT } from "./paths.js";

export function examplePath(name: string): string {
  return join(REPO_ROOT, "examples", name);
}

/** Canonical example courses and their primary export targets. */
export const EXAMPLE_COURSES: ReadonlyArray<{
  name: string;
  targets: readonly ExportTarget[];
}> = [
  { name: "security-awareness", targets: ["scorm12"] },
  { name: "branching-demo", targets: ["scorm2004"] },
  { name: "xapi-awareness", targets: ["xapi"] },
  { name: "cmi5-demo", targets: ["cmi5"] },
] as const;

export type CompiledPackageExpectations = {
  entryRel: string;
  mode: string;
  manifest?: { path: string; mustContain: string };
  forbidManifest?: boolean;
};

export function compiledExpectationsForTarget(
  target: ExportTarget,
  firstLessonId: string,
): CompiledPackageExpectations {
  switch (target) {
    case "scorm12":
      return {
        entryRel: "index.html",
        mode: "scorm12",
        manifest: { path: "imsmanifest.xml", mustContain: "1.2" },
      };
    case "scorm2004":
      return {
        entryRel: `sco/${firstLessonId}/index.html`,
        mode: "scorm2004",
        manifest: { path: "imsmanifest.xml", mustContain: "2004" },
      };
    case "standalone":
      return {
        entryRel: "index.html",
        mode: "standalone",
        forbidManifest: true,
      };
    case "xapi":
      return {
        entryRel: "index.html",
        mode: "xapi",
        manifest: { path: "tincan.xml", mustContain: "tincan" },
      };
    case "cmi5":
      return {
        entryRel: "index.html",
        mode: "cmi5",
        manifest: { path: "cmi5.xml", mustContain: "cmi5" },
      };
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}
