import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import {
  getEmbeddedStyles,
  loadComponentsStyles,
  loadLearnerStyles,
  loadRuntimeStyles,
} from "./learner-styles.js";

export {
  getEmbeddedStyles,
  loadComponentsStyles,
  loadLearnerStyles,
  loadRuntimeStyles,
};

const require = createRequire(import.meta.url);

export function getRuntimeAssetsDir(): string {
  return dirname(require.resolve("@lxpack/runtime/client"));
}

export async function readRuntimeBundle(
  assetsDir = getRuntimeAssetsDir(),
): Promise<{ clientJs: string; css: string }> {
  const clientPath = join(assetsDir, "client.js");

  if (!existsSync(clientPath)) {
    throw new Error(
      "Runtime bundle not found. Reinstall @lxpack/runtime or rebuild the monorepo.",
    );
  }

  const [clientJs, css] = await Promise.all([
    readFile(clientPath, "utf-8"),
    loadLearnerStyles(assetsDir),
  ]);

  if (clientJs.includes('from "./runtime.js"')) {
    throw new Error(
      "Runtime client bundle is not self-contained. Rebuild @lxpack/runtime.",
    );
  }

  if (clientJs.includes("@lxpack/validators")) {
    throw new Error(
      "Runtime client bundle must not import @lxpack/validators. Rebuild @lxpack/runtime.",
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
