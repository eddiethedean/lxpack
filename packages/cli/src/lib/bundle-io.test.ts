import { mkdtemp, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile: vi.fn(actual.readFile),
  };
});

import { readFile } from "node:fs/promises";
import * as bundleIo from "./bundle-io.js";

const require = createRequire(import.meta.url);
const readFileMock = vi.mocked(readFile);

async function restoreReadFileMock(): Promise<void> {
  readFileMock.mockReset();
  const actual = await vi.importActual<typeof import("node:fs/promises")>(
    "node:fs/promises",
  );
  readFileMock.mockImplementation(actual.readFile);
}

function componentsStylesPath(): string {
  const componentsDir = dirname(require.resolve("@lxpack/components/bundle"));
  return join(componentsDir, "styles.css");
}

describe("loadLearnerStyles", () => {
  afterEach(async () => {
    await restoreReadFileMock();
  });

  it("returns runtime only when runtime CSS already includes component rules", async () => {
    const componentsPath = componentsStylesPath();
    const actual = await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises",
    );
    readFileMock.mockImplementation(async (path, ...args) => {
      if (String(path) === componentsPath) {
        return ".lxpack-extra { color: red; }";
      }
      return actual.readFile(path, ...args);
    });

    const dir = await mkdtemp(join(tmpdir(), "lxpack-styles-dedupe-"));
    await writeFile(
      join(dir, "styles.css"),
      ".lxpack-callout { padding: 1rem; }",
    );
    const css = await bundleIo.loadLearnerStyles(dir);
    expect(css).toContain(".lxpack-callout");
    expect(css).not.toContain("lxpack-extra");
  });

  it("appends component CSS when runtime lacks built-in component rules", async () => {
    const componentsPath = componentsStylesPath();
    const actual = await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises",
    );
    readFileMock.mockImplementation(async (path, ...args) => {
      if (String(path) === componentsPath) {
        return ".lxpack-callout { border: 1px solid; }";
      }
      return actual.readFile(path, ...args);
    });

    const dir = await mkdtemp(join(tmpdir(), "lxpack-styles-merge-"));
    await writeFile(join(dir, "styles.css"), "body { margin: 0; }");
    const css = await bundleIo.loadLearnerStyles(dir);
    expect(css).toContain("body { margin: 0; }");
    expect(css).toContain(".lxpack-callout { border: 1px solid; }");
  });

  it("returns runtime when component styles are empty", async () => {
    const componentsPath = componentsStylesPath();
    const actual = await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises",
    );
    readFileMock.mockImplementation(async (path, ...args) => {
      if (String(path) === componentsPath) {
        return "";
      }
      return actual.readFile(path, ...args);
    });

    const dir = await mkdtemp(join(tmpdir(), "lxpack-styles-empty-components-"));
    await writeFile(join(dir, "styles.css"), "body { color: #fff; }");
    const css = await bundleIo.loadLearnerStyles(dir);
    expect(css).toBe("body { color: #fff; }");
  });
});

describe("loadComponentsStyles", () => {
  afterEach(async () => {
    await restoreReadFileMock();
  });

  it("returns empty string when components styles.css cannot be read", async () => {
    const stylesPath = componentsStylesPath();
    const actual = await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises",
    );
    readFileMock.mockImplementation(async (path, ...args) => {
      if (String(path) === stylesPath) {
        throw new Error("ENOENT");
      }
      return actual.readFile(path, ...args);
    });
    expect(await bundleIo.loadComponentsStyles()).toBe("");
  });
});

describe("readComponentsBundle", () => {
  afterEach(async () => {
    await restoreReadFileMock();
  });

  it("returns undefined when the components bundle cannot be read", async () => {
    const bundlePath = require.resolve("@lxpack/components/bundle");
    const actual = await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises",
    );
    readFileMock.mockImplementation(async (path, ...args) => {
      if (String(path) === bundlePath) {
        throw new Error("ENOENT");
      }
      return actual.readFile(path, ...args);
    });
    expect(await bundleIo.readComponentsBundle()).toBeUndefined();
  });
});
