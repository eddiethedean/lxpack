import { describe, expect, it } from "vitest";
import { findHtmlSpaLessonByInteractionId } from "./interaction-lesson.js";
import type { NavItem } from "./types.js";

const navItems: NavItem[] = [
  {
    id: "welcome",
    kind: "lesson",
    title: "Welcome",
    lesson: { id: "welcome", type: "markdown", file: "lessons/welcome.md" },
  },
  {
    id: "phishing-lab",
    kind: "lesson",
    title: "Phishing Lab",
    lesson: { id: "phishing-lab", type: "html", path: "interactions/lab" },
  },
  {
    id: "spa1",
    kind: "lesson",
    title: "SPA",
    lesson: { id: "spa1", type: "spa", path: "spa/app" },
  },
  {
    id: "final_quiz",
    kind: "assessment",
    title: "Quiz",
    file: "assessments/final.yaml",
  },
];

describe("findHtmlSpaLessonByInteractionId", () => {
  it("returns html lesson when interaction id matches lesson id", () => {
    const item = findHtmlSpaLessonByInteractionId(navItems, "phishing-lab");
    expect(item?.id).toBe("phishing-lab");
    expect(item?.lesson.type).toBe("html");
  });

  it("returns spa lesson when interaction id matches lesson id", () => {
    const item = findHtmlSpaLessonByInteractionId(navItems, "spa1");
    expect(item?.lesson.type).toBe("spa");
  });

  it("returns undefined for markdown lessons and assessments", () => {
    expect(findHtmlSpaLessonByInteractionId(navItems, "welcome")).toBeUndefined();
    expect(findHtmlSpaLessonByInteractionId(navItems, "final_quiz")).toBeUndefined();
    expect(findHtmlSpaLessonByInteractionId(navItems, "unknown")).toBeUndefined();
  });
});
