import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

export function getEmbeddedStyles(): string {
  return `:root { --lxpack-bg: #0b1220; --lxpack-text: #f1f5f9; } body { margin: 0; font-family: system-ui, sans-serif; }`;
}

export async function loadRuntimeStyles(assetsDir: string): Promise<string> {
  try {
    return await readFile(join(assetsDir, "styles.css"), "utf-8");
  } catch {
    return getEmbeddedStyles();
  }
}

export async function loadComponentsStyles(): Promise<string> {
  try {
    const componentsDir = dirname(require.resolve("@lxpack/components/bundle"));
    return await readFile(join(componentsDir, "styles.css"), "utf-8");
  } catch {
    return "";
  }
}

/** Runtime shell + built-in component styles for preview and exports. */
export async function loadLearnerStyles(assetsDir: string): Promise<string> {
  const [runtime, components] = await Promise.all([
    loadRuntimeStyles(assetsDir),
    loadComponentsStyles(),
  ]);
  if (!components.trim()) {
    return runtime;
  }
  if (runtime.includes(".lxpack-callout")) {
    return runtime;
  }
  return `${runtime}\n${components}`;
}
