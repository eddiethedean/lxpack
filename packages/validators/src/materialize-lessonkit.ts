import { existsSync, lstatSync } from "node:fs";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import { resolveCoursePath } from "./course-paths.js";
import { assertPackagableFile } from "./packagable-path.js";
import { validateHtmlLessonPath } from "./validate/lesson-html.js";
import {
  assessmentsFromInterchange,
  interchangeToManifest,
  parseLessonkitInterchange,
  spaLessonRelativePath,
  type LessonkitInterchangeV1,
} from "./lessonkit-interchange.js";
import { formatErrorMessage, type ValidationIssue } from "./validate.js";

export interface MaterializeLessonkitOptions {
  interchange: LessonkitInterchangeV1;
  /** SPA lesson id → absolute path to folder containing index.html */
  spaDirs: Record<string, string>;
  courseDir?: string;
  writeAuthoringFiles?: boolean;
  /** Keep staging directory when materialization or validation fails */
  debug?: boolean;
}

export type MaterializeLessonkitResult =
  | { ok: true; courseDir: string }
  | { ok: false; courseDir?: string; issues: ValidationIssue[] };

async function copySpaPayload(
  sourceDir: string,
  courseDir: string,
  relPath: string,
  lessonId: string,
): Promise<ValidationIssue | null> {
  const resolvedSource = resolve(sourceDir);
  const resolvedRel = resolveCoursePath(courseDir, relPath);
  if (!resolvedRel.ok) {
    return {
      path: `lessons.${lessonId}.path`,
      message: resolvedRel.message,
      severity: "error",
    };
  }
  const resolvedDest = resolvedRel.path;

  if (!existsSync(resolvedSource)) {
    return {
      path: `spaDirs.${lessonId}`,
      message: `SPA source directory not found: ${sourceDir}`,
      severity: "error",
    };
  }

  let stat;
  try {
    stat = lstatSync(resolvedSource);
  } catch (err) {
    return {
      path: `spaDirs.${lessonId}`,
      message: formatErrorMessage(err),
      severity: "error",
    };
  }

  if (stat.isSymbolicLink()) {
    return {
      path: `spaDirs.${lessonId}`,
      message: "Symlinks are not allowed for SPA source directories",
      severity: "error",
    };
  }

  if (!stat.isDirectory()) {
    return {
      path: `spaDirs.${lessonId}`,
      message: "SPA source must be a directory",
      severity: "error",
    };
  }

  if (!existsSync(join(resolvedSource, "index.html"))) {
    return {
      path: `spaDirs.${lessonId}`,
      message: "SPA source directory must contain index.html",
      severity: "error",
    };
  }

  const pathError = validateHtmlLessonPath(relPath);
  if (pathError) {
    return {
      path: `lessons.${lessonId}.path`,
      message: pathError,
      severity: "error",
    };
  }

  try {
    await mkdir(join(resolvedDest, ".."), { recursive: true });
    await cp(resolvedSource, resolvedDest, {
      recursive: true,
      force: true,
      dereference: true,
      filter: (src) => {
        const s = lstatSync(src);
        if (s.isSymbolicLink()) {
          throw new Error(`Symlink not allowed in SPA payload: ${src}`);
        }
        return true;
      },
    });
  } catch (err) {
    return {
      path: `spaDirs.${lessonId}`,
      message: formatErrorMessage(err),
      severity: "error",
    };
  }

  const indexRel = `${relPath.replace(/\\/g, "/")}/index.html`;
  const packCheck = assertPackagableFile(
    courseDir,
    join(resolvedDest, "index.html"),
    indexRel,
  );

  if (!packCheck.ok) {
    return {
      path: `spaDirs.${lessonId}`,
      message: packCheck.message,
      severity: "error",
    };
  }

  return null;
}

export async function materializeLessonkitProject(
  options: MaterializeLessonkitOptions,
): Promise<MaterializeLessonkitResult> {
  const issues: ValidationIssue[] = [];
  let courseDir = options.courseDir ? resolve(options.courseDir) : undefined;
  let createdTemp = false;

  if (!courseDir) {
    courseDir = await mkdtemp(join(tmpdir(), "lxpack-lessonkit-"));
    createdTemp = true;
  }

  const cleanup = async () => {
    if (createdTemp && !options.debug) {
      await rm(courseDir!, { recursive: true, force: true }).catch(() => {});
    }
  };

  try {
    await mkdir(courseDir, { recursive: true });

    const manifest = interchangeToManifest(options.interchange);

    for (const lesson of options.interchange.lessons) {
      const relPath = spaLessonRelativePath(lesson);
      if (!relPath) {
        issues.push({
          path: `lessons.${lesson.id}.path`,
          message: "SPA lesson requires path or build.outputDir",
          severity: "error",
        });
        continue;
      }

      const source = options.spaDirs[lesson.id];
      if (!source) {
        issues.push({
          path: `spaDirs.${lesson.id}`,
          message: `Missing spaDirs entry for lesson "${lesson.id}"`,
          severity: "error",
        });
        continue;
      }

      const copyIssue = await copySpaPayload(
        source,
        courseDir,
        relPath,
        lesson.id,
      );
      if (copyIssue) {
        issues.push(copyIssue);
      }
    }

    if (issues.some((i) => i.severity === "error")) {
      if (!options.debug) {
        await cleanup();
      }
      return {
        ok: false,
        courseDir: options.debug ? courseDir : undefined,
        issues,
      };
    }

    await writeFile(join(courseDir, "course.yaml"), stringifyYaml(manifest), "utf-8");

    if (options.writeAuthoringFiles) {
      await writeFile(
        join(courseDir, "lessonkit.json"),
        JSON.stringify(options.interchange, null, 2),
        "utf-8",
      );

      if (options.interchange.assessments?.length) {
        await mkdir(join(courseDir, "assessments"), { recursive: true });
        for (const assessment of options.interchange.assessments) {
          await writeFile(
            join(courseDir, "assessments", `${assessment.id}.yaml`),
            stringifyYaml(assessment),
            "utf-8",
          );
        }
      }
    }

    return { ok: true, courseDir };
  } catch (err) {
    if (!options.debug) {
      await cleanup();
    }
    return {
      ok: false,
      courseDir: options.debug ? courseDir : undefined,
      issues: [
        {
          path: "materialize",
          message: formatErrorMessage(err),
          severity: "error",
        },
      ],
    };
  }
}

export function resolvePackageAssessments(
  interchange: LessonkitInterchangeV1,
  injected?: unknown[],
): unknown[] | undefined {
  if (injected != null) {
    return injected;
  }
  return assessmentsFromInterchange(interchange);
}

export function parseInterchangeInput(
  raw: unknown,
  pathLabel = "interchange",
):
  | { ok: true; data: LessonkitInterchangeV1 }
  | { ok: false; issues: ValidationIssue[] } {
  return parseLessonkitInterchange(raw, pathLabel);
}
