import { describe, expect, it, beforeEach } from "vitest";

describe("components bundle", () => {
  beforeEach(async () => {
    await import("./bundle.js");
  });

  it("exposes window mount API for known and unknown components", () => {
    const api = window.__LXPACK_COMPONENTS__;
    expect(api).toBeDefined();

    const el = document.createElement("div");
    api!.mount(el, "missing", {}, "/course/");
    expect(el.textContent).toContain("Unknown component: missing");

    el.innerHTML = "";
    api!.mount(el, "callout", { body: "Hi" }, "/course/");
    expect(el.innerHTML).toContain("Hi");
  });
});
