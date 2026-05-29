/** Built-in theme presets (expanded to runtime.cssVariables). */
export const THEME_PRESET_VARIABLES: Record<string, Record<string, string>> = {
  "lessonkit:default": {
    "--lk-color-primary": "#2563eb",
    "--lk-color-background": "#ffffff",
    "--lk-color-text": "#111827",
  },
  "lessonkit:brand": {
    "--lk-color-primary": "#0d9488",
    "--lk-color-background": "#f8fafc",
    "--lk-color-text": "#0f172a",
  },
};

export type InterchangeRuntimeInput = {
  theme?: string;
  cssVariables?: Record<string, string>;
  themePreset?: string;
};

export type ResolvedInterchangeRuntime = {
  theme: string;
  cssVariables?: Record<string, string>;
};

export function resolveRuntimeFromInterchange(
  runtime?: InterchangeRuntimeInput,
): ResolvedInterchangeRuntime | undefined {
  if (!runtime) return undefined;

  const theme = runtime.theme ?? "modern";
  let cssVariables: Record<string, string> = {};

  if (runtime.themePreset) {
    const preset = THEME_PRESET_VARIABLES[runtime.themePreset];
    if (preset) {
      cssVariables = { ...preset };
    }
  }

  if (runtime.cssVariables) {
    cssVariables = { ...cssVariables, ...runtime.cssVariables };
  }

  return {
    theme,
    ...(Object.keys(cssVariables).length ? { cssVariables } : {}),
  };
}

export function warnThemePresetCssOverlap(
  runtime?: InterchangeRuntimeInput,
): string | null {
  if (!runtime?.themePreset || !runtime.cssVariables) return null;
  const preset = THEME_PRESET_VARIABLES[runtime.themePreset];
  if (!preset) return null;
  const overlap = Object.keys(runtime.cssVariables).filter((k) => k in preset);
  if (!overlap.length) return null;
  return `runtime.cssVariables overrides preset keys from ${runtime.themePreset}: ${overlap.join(", ")}`;
}
