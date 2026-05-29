import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseLessonkitInterchange,
  type LessonkitInterchangeV1,
} from "@lxpack/validators";

export function parseSpaLessonOption(value: string): { id: string; path: string } {
  const eq = value.indexOf("=");
  if (eq <= 0) {
    throw new Error(
      `Invalid --spa-lesson value "${value}" (expected lessonId=/absolute/path)`,
    );
  }
  const id = value.slice(0, eq).trim();
  const path = value.slice(eq + 1).trim();
  if (!id || !path) {
    throw new Error(
      `Invalid --spa-lesson value "${value}" (expected lessonId=/absolute/path)`,
    );
  }
  return { id, path: resolve(path) };
}

export async function loadLessonkitInterchangeFile(
  interchangePath: string,
): Promise<
  | { ok: true; data: LessonkitInterchangeV1 }
  | { ok: false; issues: Array<{ path?: string; message: string }> }
> {
  const resolved = resolve(interchangePath);
  let raw: string;
  try {
    raw = await readFile(resolved, "utf-8");
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          path: interchangePath,
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          path: interchangePath,
          message: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }

  const parsed = parseLessonkitInterchange(json, interchangePath);
  if (!parsed.ok) {
    return { ok: false, issues: parsed.issues };
  }
  return { ok: true, data: parsed.data };
}

export function buildSpaDirsFromInterchange(
  interchange: LessonkitInterchangeV1,
  spaLessons: Array<{ id: string; path: string }>,
  spaDist?: string,
): Record<string, string> {
  const spaDirs: Record<string, string> = {};
  for (const entry of spaLessons) {
    spaDirs[entry.id] = entry.path;
  }

  if (spaDist && interchange.lessons.length === 1) {
    spaDirs[interchange.lessons[0]!.id] = resolve(spaDist);
  }

  return spaDirs;
}

export function validateSpaDirsForInterchange(
  interchange: LessonkitInterchangeV1,
  spaDirs: Record<string, string>,
): string | null {
  const lessonIds = new Set(interchange.lessons.map((l) => l.id));
  for (const id of Object.keys(spaDirs)) {
    if (!lessonIds.has(id)) {
      return `Unknown SPA lesson id "${id}" in --spa-lesson`;
    }
  }
  for (const lesson of interchange.lessons) {
    if (!spaDirs[lesson.id]) {
      return `Missing --spa-lesson or --spa-dist for lesson "${lesson.id}"`;
    }
  }
  return null;
}
