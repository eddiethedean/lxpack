import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { LessonkitInterchangeV1 } from "@lxpack/validators";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function conformanceSpaDir(): string {
  return join(pkgRoot, "fixtures", "spa");
}

export function conformanceInterchange(): LessonkitInterchangeV1 {
  return {
    format: "lessonkit",
    version: "1",
    course: {
      id: "conformance-course",
      title: "Conformance Fixture",
    },
    lessons: [
      {
        id: "conformance_spa",
        type: "spa",
        path: "spa",
        title: "Conformance SPA",
      },
    ],
    tracking: {
      completion: { threshold: 1 },
      xapi: {
        activityIri: "https://lxpack.dev/conformance/course",
      },
    },
  };
}
