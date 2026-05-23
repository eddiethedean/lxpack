import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = join(__dirname, "../..");

export function fixturePath(name: string): string {
  return join(REPO_ROOT, "test/fixtures", name);
}
