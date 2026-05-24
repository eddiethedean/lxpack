import { describe, expect, it } from "vitest";
import { getComponentMount } from "./registry.js";
import "./builtins.js";

describe("builtin components", () => {
  it("renders callout with escaped content", () => {
    const el = document.createElement("div");
    getComponentMount("callout")!(
      el,
      {
        variant: "warn",
        body: "<script>",
      },
      "/course/",
    );
    expect(el.innerHTML).toContain("lxpack-callout-warn");
    expect(el.innerHTML).toContain("&lt;script&gt;");
  });

  it("renders image-card with relative and absolute URLs", () => {
    const relative = document.createElement("div");
    getComponentMount("image-card")!(
      relative,
      { title: "T", src: "img.png", caption: "Cap" },
      "/course/",
    );
    expect(relative.innerHTML).toContain('src="/course/img.png"');
    expect(relative.innerHTML).toContain("<figcaption>Cap</figcaption>");

    const absolute = document.createElement("div");
    getComponentMount("image-card")!(
      absolute,
      { src: "https://example.com/x.png" },
      "/course/",
    );
    expect(absolute.innerHTML).toContain("https://example.com/x.png");
    expect(absolute.innerHTML).not.toContain("<figcaption>");

    const noSlash = document.createElement("div");
    getComponentMount("image-card")!(
      noSlash,
      { src: "a.png" },
      "/course",
    );
    expect(noSlash.innerHTML).toContain('src="/course/a.png"');
  });

  it("renders checklist items", () => {
    const el = document.createElement("div");
    getComponentMount("checklist")!(el, { items: ["One", "Two"] }, "/course/");
    expect(el.querySelectorAll("li")).toHaveLength(2);
    expect(el.textContent).toContain("One");
  });

  it("uses defaults for missing props", () => {
    const callout = document.createElement("div");
    getComponentMount("callout")!(callout, {}, "/course/");
    expect(callout.innerHTML).toContain("lxpack-callout-info");

    const checklist = document.createElement("div");
    getComponentMount("checklist")!(checklist, {}, "/course/");
    expect(checklist.querySelector("ul")?.children.length).toBe(0);

    getComponentMount("checklist")!(checklist, { items: "not-an-array" }, "/course/");
    expect(checklist.querySelector("ul")?.children.length).toBe(0);

    const image = document.createElement("div");
    getComponentMount("image-card")!(image, { title: "Alt only" }, "/course/");
    expect(image.innerHTML).toContain('alt="Alt only"');
    expect(image.innerHTML).toContain('src="/course/"');
  });
});
