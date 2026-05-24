import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

export function getRuntimeAssetsDir(): string {
  return dirname(require.resolve("@lxpack/runtime/client"));
}

export function getEmbeddedStyles(): string {
  return `:root { --lxpack-bg: #0f1419; } body { margin: 0; }`;
}

export async function loadRuntimeStyles(assetsDir: string): Promise<string> {
  try {
    return await readFile(join(assetsDir, "styles.css"), "utf-8");
  } catch {
    return getEmbeddedStyles();
  }
}

export async function readRuntimeBundle(
  assetsDir = getRuntimeAssetsDir(),
): Promise<{
  clientJs: string;
  css: string;
}> {
  const clientPath = join(assetsDir, "client.js");

  if (!existsSync(clientPath)) {
    throw new Error(
      "Runtime bundle not found. Run `pnpm build` from the LXPack repo root, or reinstall @lxpack/runtime.",
    );
  }

  const [clientJs, css] = await Promise.all([
    readFile(clientPath, "utf-8"),
    loadRuntimeStyles(assetsDir),
  ]);

  if (clientJs.includes('from "./runtime.js"')) {
    throw new Error(
      "Runtime client bundle is not self-contained. Rebuild @lxpack/runtime with `pnpm build`.",
    );
  }

  return { clientJs, css };
}

export async function readComponentsBundle(): Promise<string | undefined> {
  try {
    const bundlePath = require.resolve("@lxpack/components/bundle");
    return await readFile(bundlePath, "utf-8");
  } catch {
    return undefined;
  }
}
