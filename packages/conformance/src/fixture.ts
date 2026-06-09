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

/** Interchange with inline multi-select MCQ for answer-key bundle conformance. */
export function conformanceMultiSelectInterchange(): LessonkitInterchangeV1 {
  return {
    ...conformanceInterchange(),
    assessments: [
      {
        id: "conformance_quiz",
        title: "Conformance Multi-Select",
        passingScore: 0.7,
        questions: [
          {
            id: "q1",
            prompt: "Select all that apply",
            choices: [
              { id: "a", text: "Correct A", correct: true },
              { id: "b", text: "Wrong B" },
              { id: "c", text: "Correct C", correct: true },
            ],
          },
        ],
      },
    ],
  };
}
