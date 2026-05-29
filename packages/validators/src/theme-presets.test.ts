import { describe, expect, it } from "vitest";
import {
  resolveRuntimeFromInterchange,
  warnThemePresetCssOverlap,
  warnUnknownThemePreset,
} from "./theme-presets.js";

describe("resolveRuntimeFromInterchange", () => {
  it("expands lessonkit:default preset", () => {
    const resolved = resolveRuntimeFromInterchange({
      themePreset: "lessonkit:default",
    });
    expect(resolved?.cssVariables?.["--lk-color-primary"]).toBe("#2563eb");
  });

  it("merges cssVariables over preset", () => {
    const resolved = resolveRuntimeFromInterchange({
      themePreset: "lessonkit:default",
      cssVariables: { "--lk-color-primary": "#000" },
    });
    expect(resolved?.cssVariables?.["--lk-color-primary"]).toBe("#000");
  });
});

describe("warnUnknownThemePreset", () => {
  it("warns on unrecognized preset names", () => {
    expect(
      warnUnknownThemePreset({ themePreset: "lessonkit:unknown" }),
    ).toContain("Unknown runtime.themePreset");
  });
});

describe("warnThemePresetCssOverlap", () => {
  it("warns on overlapping keys", () => {
    expect(
      warnThemePresetCssOverlap({
        themePreset: "lessonkit:default",
        cssVariables: { "--lk-color-primary": "#000" },
      }),
    ).toContain("overrides preset");
  });
});
