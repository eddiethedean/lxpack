import type { NavItem } from "./types.js";

/** Resolve html/spa lesson when interaction id matches lesson id (LXPack convention). */
export function findHtmlSpaLessonByInteractionId(
  navItems: NavItem[],
  interactionId: string,
): Extract<NavItem, { kind: "lesson" }> | undefined {
  const item = navItems.find(
    (n) =>
      n.kind === "lesson" &&
      n.id === interactionId &&
      (n.lesson.type === "html" || n.lesson.type === "spa"),
  );
  return item?.kind === "lesson" ? item : undefined;
}

/** Push lesson id when an incomplete html/spa lesson is opened (skip duplicate top). */
export function pushPendingInteractionLesson(
  stack: string[],
  lessonId: string,
): void {
  if (stack[stack.length - 1] !== lessonId) {
    stack.push(lessonId);
  }
}

/** Remove lesson id after interaction completion is mirrored to the lesson. */
export function removePendingInteractionLesson(
  stack: string[],
  lessonId: string,
): void {
  const index = stack.lastIndexOf(lessonId);
  if (index >= 0) stack.splice(index, 1);
}

/**
 * Resolve which html/spa lesson should receive `interaction_${lessonId}` for flow
 * `interaction.done` when `track()` uses an event id that may differ from the lesson id.
 */
export function resolveInteractionLessonForCompletion(
  navItems: NavItem[],
  currentIndex: number,
  interactionId: string,
  pendingLessonIds: readonly string[],
): string | undefined {
  const byInteractionId = findHtmlSpaLessonByInteractionId(
    navItems,
    interactionId,
  );
  if (byInteractionId) return byInteractionId.lesson.id;

  const current = navItems[currentIndex];
  if (
    current?.kind === "lesson" &&
    (current.lesson.type === "html" || current.lesson.type === "spa")
  ) {
    return current.lesson.id;
  }

  if (pendingLessonIds.length > 0) {
    return pendingLessonIds[pendingLessonIds.length - 1];
  }

  return undefined;
}
