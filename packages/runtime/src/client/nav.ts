import type { CourseManifest } from "@lxpack/validators";
import { escapeHtml } from "./html-utils.js";
import type { NavItem } from "./types.js";

export type { NavItem };

export function buildNavItems(manifest: CourseManifest): NavItem[] {
  const items: NavItem[] = manifest.lessons.map((lesson) => ({
    kind: "lesson",
    id: lesson.id,
    title: lesson.title ?? lesson.id,
    lesson,
  }));

  for (const ref of manifest.assessments ?? []) {
    items.push({
      kind: "assessment",
      id: ref.id,
      title: ref.id.replace(/_/g, " "),
      file: ref.file,
    });
  }

  return items;
}

export function renderNav(
  navEl: HTMLElement,
  items: NavItem[],
  currentId: string,
  completedLessons: string[],
  passedAssessments: Set<string>,
  onSelect: (id: string) => void,
  isNavEnabled?: (id: string) => boolean,
): void {
  navEl.innerHTML = items
    .map((item) => {
      const isActive = item.id === currentId;
      const isCompleted =
        item.kind === "lesson"
          ? completedLessons.includes(item.id)
          : passedAssessments.has(item.id);
      const disabled = isNavEnabled ? !isNavEnabled(item.id) : false;
      const ariaCurrent = isActive ? ' aria-current="page"' : "";
      const cssClass =
        item.kind === "assessment" ? "lxpack-nav-assessment" : "";

      return `
      <button
        type="button"
        class="lxpack-nav-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${cssClass}"
        data-nav-id="${escapeHtml(item.id)}"
        ${disabled ? " disabled" : ""}
        ${ariaCurrent}
      >
        ${escapeHtml(item.title)}${item.kind === "assessment" ? " (Quiz)" : ""}
      </button>
    `;
    })
    .join("");

  navEl.querySelectorAll(".lxpack-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).dataset.navId;
      if (id) onSelect(id);
    });
  });
}
