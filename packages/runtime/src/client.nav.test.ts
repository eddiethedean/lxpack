import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as flow from "./flow.js";
import { init } from "./client.js";

describe("client navigation fallbacks", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="lxpack-app"></div>';
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Nav",
        version: "1.0.0",
        lessons: [
          { id: "a", type: "markdown", file: "lessons/a.md" },
          { id: "b", type: "markdown", file: "lessons/b.md" },
          { id: "c", type: "markdown", file: "lessons/c.md" },
        ],
        variables: { path: { default: "a", type: "string" } },
        flow: [{ when: { variable: { eq: ["path", "jump"] } }, goto: "c" }],
      },
      baseUrl: "/course",
      mode: "preview",
    };
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "# Lesson",
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    delete window.__LXPACK_CONFIG__;
    delete window.lxpack;
  });

  it("disables sidebar nav targets that bypass flow rules", async () => {
    init();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="a"]')?.classList.contains("active"),
      ).toBe(true),
    );
    const navC = document.querySelector(
      '[data-nav-id="c"]',
    ) as HTMLButtonElement;
    expect(navC.disabled).toBe(true);
    navC.click();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="a"]')?.classList.contains("active"),
      ).toBe(true),
    );
  });

  it("uses index fallback when flow resolution returns null", async () => {
    vi.spyOn(flow, "resolveNextActivityId").mockReturnValue(null);
    vi.spyOn(flow, "resolvePreviousActivityId").mockReturnValue(null);

    init();
    const next = document.getElementById("lxpack-next") as HTMLButtonElement;
    next.click();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="b"]')?.classList.contains("active"),
      ).toBe(true),
    );

    const prev = document.getElementById("lxpack-prev") as HTMLButtonElement;
    prev.click();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="a"]')?.classList.contains("active"),
      ).toBe(true),
    );
  });

  it("keeps next enabled on the last lesson when flow rules exist", async () => {
    init();
    const next = document.getElementById("lxpack-next") as HTMLButtonElement;
    next.click();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="b"]')?.classList.contains("active"),
      ).toBe(true),
    );
    next.click();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="c"]')?.classList.contains("active"),
      ).toBe(true),
    );
    expect(next.disabled).toBe(false);
  });

  it("does not apply flow jump for unrelated track events", async () => {
    init();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="a"]')?.classList.contains("active"),
      ).toBe(true),
    );
    window.lxpack?.track({ type: "custom" });
    expect(
      document.querySelector('[data-nav-id="a"]')?.classList.contains("active"),
    ).toBe(true);
  });

  it("jumps via flow after track events", async () => {
    init();
    window.lxpack?.setVariable("path", "jump");
    window.lxpack?.track({ type: "interaction", id: "choose" });
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="c"]')?.classList.contains("active"),
      ).toBe(true),
    );
  });

  it("jumps via interaction.done when track id differs from html lesson id", async () => {
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Nav",
        version: "1.0.0",
        lessons: [
          { id: "intro", type: "markdown", file: "lessons/intro.md" },
          {
            id: "phishing-lab",
            type: "html",
            path: "interactions/phishing-lab",
          },
          { id: "wrap", type: "markdown", file: "lessons/wrap.md" },
        ],
        flow: [
          { when: { interaction: { done: "phishing-lab" } }, goto: "wrap" },
        ],
      },
      baseUrl: "/course",
      mode: "preview",
    };

    init();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="intro"]')?.classList.contains("active"),
      ).toBe(true),
    );
    const next = document.getElementById("lxpack-next") as HTMLButtonElement;
    next.click();
    await vi.waitFor(() =>
      expect(
        document.querySelector(".lxpack-interaction-frame"),
      ).toBeTruthy(),
    );

    window.lxpack?.track({
      type: "interaction",
      id: "phishing_detected",
      data: true,
    });
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="wrap"]')?.classList.contains("active"),
      ).toBe(true),
    );
  });

  it("warns when SCORM 2004 single-SCO flow goto is outside launch nav", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Nav",
        version: "1.0.0",
        lessons: [
          { id: "intro", type: "markdown", file: "lessons/intro.md" },
          { id: "wrap", type: "markdown", file: "lessons/wrap.md" },
        ],
        flow: [{ when: { assessment: { passed: "final" } }, goto: "wrap" }],
        assessments: [{ id: "final", file: "assessments/final.yaml" }],
      },
      assessments: {
        final: {
          id: "final",
          title: "Final",
          passingScore: 0.5,
          questions: [
            {
              id: "q1",
              prompt: "Ok?",
              choices: [{ id: "a", text: "Yes", correct: true }],
            },
          ],
        },
      },
      answerKeys: { final: { q1: "a" } },
      assessmentConfigs: { final: { maxAttempts: 3 } },
      baseUrl: "/course",
      mode: "scorm2004",
      activityId: "intro",
    };

    init();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="intro"]')?.classList.contains(
          "active",
        ),
      ).toBe(true),
    );

    window.lxpack?.track({
      type: "assessment",
      id: "final",
      data: { score: 1, passingScore: 0.5 },
    });
    await vi.waitFor(() =>
      expect(
        warn.mock.calls.some((c) =>
          String(c[0]).includes("not available in this SCORM launch"),
        ),
      ).toBe(true),
    );
    warn.mockRestore();
  });

  it("does not jump via interaction.done when track data is false", async () => {
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Nav",
        version: "1.0.0",
        lessons: [
          {
            id: "phishing-lab",
            type: "html",
            path: "interactions/phishing-lab",
          },
          { id: "wrap", type: "markdown", file: "lessons/wrap.md" },
        ],
        flow: [
          { when: { interaction: { done: "phishing-lab" } }, goto: "wrap" },
        ],
      },
      baseUrl: "/course",
      mode: "preview",
    };

    init();
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-nav-id="phishing-lab"]')?.classList.contains(
          "active",
        ),
      ).toBe(true),
    );

    window.lxpack?.track({
      type: "interaction",
      id: "phishing_detected",
      data: false,
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(
      document.querySelector('[data-nav-id="wrap"]')?.classList.contains("active"),
    ).toBe(false);
  });
});
