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
});
