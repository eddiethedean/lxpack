import type { Lesson } from "../schemas.js";
import type { ValidationIssue } from "../validate.js";
import { validateMarkdownLesson } from "./lesson-markdown.js";
import { validateHtmlLesson } from "./lesson-html.js";
import { validateSpaLesson } from "./lesson-spa.js";
import { validateComponentLesson } from "./lesson-component.js";

export type LessonValidator = (
  courseDir: string,
  lesson: Lesson,
) => ValidationIssue[] | Promise<ValidationIssue[]>;

export const lessonValidators: Record<string, LessonValidator> = {
  markdown: (courseDir, lesson) =>
    validateMarkdownLesson(courseDir, lesson as Extract<Lesson, { type: "markdown" }>),
  html: (courseDir, lesson) =>
    validateHtmlLesson(courseDir, lesson as Extract<Lesson, { type: "html" }>),
  spa: (courseDir, lesson) =>
    validateSpaLesson(courseDir, lesson as Extract<Lesson, { type: "spa" }>),
  component: (courseDir, lesson) =>
    validateComponentLesson(courseDir, lesson as Extract<Lesson, { type: "component" }>),
};

export function registerLessonValidator(
  type: string,
  validator: LessonValidator,
): void {
  lessonValidators[type] = validator;
}

export function getLessonValidator(type: string): LessonValidator | undefined {
  return lessonValidators[type];
}
