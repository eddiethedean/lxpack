import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type InterchangeLesson = {
  id: string;
  title?: string;
  type: "spa";
  path?: string;
  build?: { outputDir?: string };
};

export type LessonKitInterchange = {
  format?: string;
  version?: string;
  course?: { id?: string; title?: string };
  lessons?: InterchangeLesson[];
  tracking?: { completion?: { threshold?: number } };
};

export async function loadLessonKitInterchange(
  courseDir: string,
): Promise<{ fileName: string; data: LessonKitInterchange } | null> {
  const candidates = ["lessonkit.json", "lxpack.import.json"];
  for (const fileName of candidates) {
    const p = join(courseDir, fileName);
    if (!existsSync(p)) continue;
    const raw = await readFile(p, "utf-8");
    const data = JSON.parse(raw) as LessonKitInterchange;
    return { fileName, data };
  }
  return null;
}

