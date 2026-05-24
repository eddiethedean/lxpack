import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bootstrapClient,
  init,
  renderComponentLesson,
  renderHtmlInteraction,
  renderMarkdown,
  renderNav,
  scoreAssessment,
} from "./client.js";
import type { LearnerAssessment } from "@lxpack/validators";

const manifest = {
  title: "Client Test",
  version: "1.0.0",
  lessons: [
    { id: "md", title: "Markdown", type: "markdown" as const, file: "lessons/a.md" },
    { id: "html", type: "html" as const, path: "interactions/lab" },
    { id: "bad", type: "markdown" as const },
  ],
};

function setupDom(): void {
  document.body.innerHTML = '<div id="lxpack-app"></div>';
  window.__LXPACK_CONFIG__ = {
    manifest,
    baseUrl: "/course",
    mode: "preview",
  };
}

describe("client", () => {
  beforeEach(() => {
    setupDom();
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "# Test",
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    delete window.__LXPACK_CONFIG__;
    delete window.lxpack;
  });

  it("throws when config is missing", () => {
    delete window.__LXPACK_CONFIG__;
    expect(() => init()).toThrow("LXPack runtime config not found");
  });

  it("throws when #lxpack-app is missing", () => {
    document.body.innerHTML = "";
    expect(() => init()).toThrow("#lxpack-app element not found");
  });

  it("renders course shell and navigates lessons", async () => {
    init();

    expect(document.querySelector(".lxpack-title")?.textContent).toBe(
      "Client Test",
    );
    expect(window.lxpack).toBeDefined();

    await vi.waitFor(() =>
      expect(document.querySelector('[data-nav-id="md"]')).toBeTruthy(),
    );

    const next = document.getElementById("lxpack-next") as HTMLButtonElement;
    next.click();
    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-interaction-frame")).toBeTruthy(),
    );

    const navItem = document.querySelector(
      '[data-nav-id="md"]',
    ) as HTMLButtonElement;
    navItem.click();
    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-markdown")).toBeTruthy(),
    );

    const complete = document.getElementById(
      "lxpack-complete",
    ) as HTMLButtonElement;
    complete.click();
    expect(window.lxpack?.getProgress().completedLessons).toContain("md");

    window.dispatchEvent(new Event("beforeunload"));
  });

  it("handles courses with no lessons without crashing", () => {
    window.__LXPACK_CONFIG__ = {
      manifest: { title: "Empty", version: "1.0.0", lessons: [] },
      baseUrl: "/course",
      mode: "preview",
      progress: {
        currentLessonId: "missing",
        completedLessons: [],
        assessmentScores: {},
        suspendData: {},
      },
    };
    expect(() => init()).not.toThrow();
  });

  it("throws when markdown fetch fails", async () => {
    const { renderMarkdown } = await import("./client.js");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      text: async () => "",
    } as Response);
    const el = document.createElement("div");
    await expect(renderMarkdown(el, "/course", "lessons/a.md")).rejects.toThrow(
      "Failed to load lesson",
    );
  });

  it("shows invalid lesson message", async () => {
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "bad", type: "markdown" }],
      },
      baseUrl: "/course",
      mode: "preview",
    };

    init();
    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-error")).toBeTruthy(),
    );
  });

  it("renders HTML interactions in an iframe", () => {
    const el = document.createElement("div");
    renderHtmlInteraction(el, "/course", "interactions/lab");
    expect(el.querySelector("iframe")?.getAttribute("src")).toBe(
      "/course/interactions/lab/index.html",
    );
  });

  it("invokes nav handler only when lesson id is present", () => {
    const nav = document.createElement("nav");
    const onSelect = vi.fn();
    renderNav(nav, manifest.lessons.map((lesson) => ({
      kind: "lesson" as const,
      id: lesson.id,
      title: lesson.title ?? lesson.id,
      lesson,
    })), "md", [], new Set(), onSelect);
    const btn = nav.querySelector("[data-nav-id='html']") as HTMLButtonElement;
    btn.click();
    expect(onSelect).toHaveBeenCalledWith("html");
  });

  it("bootstraps immediately when the document is already loaded", () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
    const addSpy = vi.spyOn(document, "addEventListener");
    setupDom();
    bootstrapClient();
    expect(addSpy).not.toHaveBeenCalledWith(
      "DOMContentLoaded",
      expect.any(Function),
    );
    expect(document.querySelector(".lxpack-title")).toBeTruthy();
  });

  it("clicks previous lesson button", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "# Hi",
    } as Response);
    init();
    const next = document.getElementById("lxpack-next") as HTMLButtonElement;
    next.click();
    await vi.waitFor(() => expect(next.disabled).toBe(false));
    const prev = document.getElementById("lxpack-prev") as HTMLButtonElement;
    prev.click();
    await vi.waitFor(() => expect(prev.disabled).toBe(true));
  });

  it("loads markdown from base URLs with trailing slashes", async () => {
    const el = document.createElement("div");
    await renderMarkdown(el, "/course/", "lessons/a.md");
    expect(el.querySelector(".lxpack-markdown")).toBeTruthy();
  });

  it("scores assessments using answer keys", () => {
    const assessment: LearnerAssessment = {
      id: "quiz",
      passingScore: 0.5,
      questions: [
        {
          id: "q1",
          prompt: "P",
          choices: [
            { id: "a", text: "A" },
            { id: "b", text: "B" },
          ],
        },
      ],
    };
    const form = document.createElement("form");
    form.innerHTML = `
      <input type="radio" name="q-q1" value="a" checked />
    `;
    expect(scoreAssessment(assessment, { q1: "a" }, form)).toBe(1);
  });

  it("renders component lessons via the components registry", () => {
    const el = document.createElement("div");
    const mount = vi.fn();
    window.__LXPACK_COMPONENTS__ = { mount };
    renderComponentLesson(el, "callout", { body: "Hi" }, "/course");
    expect(mount).toHaveBeenCalledWith(el, "callout", { body: "Hi" }, "/course");
    delete window.__LXPACK_COMPONENTS__;
  });

  it("renders component lessons through init", async () => {
    const mount = vi.fn();
    window.__LXPACK_COMPONENTS__ = { mount };
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Components",
        version: "1.0.0",
        lessons: [
          {
            id: "tip",
            type: "component",
            component: "callout",
            props: { body: "Hello" },
          },
        ],
      },
      baseUrl: "/course",
      mode: "preview",
    };
    init();
    await vi.waitFor(() => expect(mount).toHaveBeenCalled());
    delete window.__LXPACK_COMPONENTS__;
  });

  it("shows an error when the components bundle is missing", () => {
    const el = document.createElement("div");
    delete window.__LXPACK_COMPONENTS__;
    renderComponentLesson(el, "callout", undefined, "/course");
    expect(el.textContent).toContain("requires the LXPack components bundle");
  });

  it("registers DOMContentLoaded when document is loading", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");

    bootstrapClient();
    expect(addSpy).toHaveBeenCalledWith("DOMContentLoaded", init);
  });
});
