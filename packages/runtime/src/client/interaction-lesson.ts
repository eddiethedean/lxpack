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
