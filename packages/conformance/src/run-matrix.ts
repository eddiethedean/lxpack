import { rm } from "node:fs/promises";
import { packageLessonkit } from "@lxpack/api";
import type { ExportTarget } from "@lxpack/scorm";
import { conformanceInterchange, conformanceSpaDir } from "./fixture.js";

export const DEFAULT_CONFORMANCE_TARGETS: ExportTarget[] = [
  "standalone",
  "scorm12",
  "scorm2004",
  "xapi",
  "cmi5",
];

export type ConformanceTargetResult = {
  target: ExportTarget;
  ok: boolean;
  message?: string;
};

export type ConformanceMatrixResult = {
  ok: boolean;
  results: ConformanceTargetResult[];
};

export async function runConformanceMatrix(options?: {
  targets?: ExportTarget[];
}): Promise<ConformanceMatrixResult> {
  const targets = options?.targets ?? DEFAULT_CONFORMANCE_TARGETS;
  const interchange = conformanceInterchange();
  const spaDir = conformanceSpaDir();
  const results: ConformanceTargetResult[] = [];

  for (const target of targets) {
    let courseDir: string | undefined;
    try {
      const built = await packageLessonkit({
        interchange,
        spaDirs: { conformance_spa: spaDir },
        target,
        writeAuthoringFiles: true,
        debug: true,
      });
      if (!built.ok) {
        results.push({
          target,
          ok: false,
          message: built.issues.map((i) => i.message).join("; "),
        });
        courseDir = built.courseDir;
        continue;
      }
      courseDir = built.courseDir;
      const hasOutput = Boolean(built.outputPath ?? built.outputDir);
      results.push({
        target,
        ok: hasOutput && (built.fileCount ?? 0) > 0,
        message: hasOutput ? undefined : "No output path",
      });
    } catch (err) {
      results.push({
        target,
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      if (courseDir) {
        await rm(courseDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  }

  return {
    ok: results.every((r) => r.ok),
    results,
  };
}
