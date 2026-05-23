import { existsSync } from "node:fs";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { execSync } from "node:child_process";
import { fixturePath, REPO_ROOT } from "../../test/helpers/paths.js";
import * as previewCommands from "./commands/preview.js";
import { findCourseDir } from "./utils.js";

describe("resolvePreviewDeps", () => {
  it("returns defaults when deps are undefined", () => {
    const resolved = previewCommands.resolvePreviewDeps(undefined);
    expect(resolved.findCourseDir).toBe(findCourseDir);
    expect(resolved.startPreview).toBe(previewCommands.startPreview);
    expect(resolved.logPreviewStarted).toBe(previewCommands.logPreviewStarted);
  });

  it("falls back per field when deps object is empty", () => {
    const resolved = previewCommands.resolvePreviewDeps({});
    expect(resolved.findCourseDir).toBe(findCourseDir);
    expect(resolved.startPreview).toBe(previewCommands.startPreview);
    expect(resolved.logPreviewStarted).toBe(previewCommands.logPreviewStarted);
  });

  it("uses provided overrides when supplied", () => {
    const overrides = {
      findCourseDir: () => "/tmp",
      startPreview: async () => {
        throw new Error("unused");
      },
      logPreviewStarted: () => {},
    };
    const resolved = previewCommands.resolvePreviewDeps(overrides);
    expect(resolved.findCourseDir).toBe(overrides.findCourseDir);
    expect(resolved.startPreview).toBe(overrides.startPreview);
    expect(resolved.logPreviewStarted).toBe(overrides.logPreviewStarted);
  });
});

describe("loadPreviewStyles", () => {
  it("returns fallback CSS when the styles file is missing", async () => {
    const css = await previewCommands.loadPreviewStyles(
      "/nonexistent/styles.css",
    );
    expect(css).toBe("body { margin: 0; }");
  });
});

describe("createPreviewServer", () => {
  let app: Awaited<ReturnType<typeof previewCommands.createPreviewServer>>;

  beforeAll(() => {
    const client = `${REPO_ROOT}/packages/runtime/dist/client.js`;
    if (!existsSync(client)) {
      execSync("pnpm --filter @lxpack/runtime build", {
        cwd: REPO_ROOT,
        stdio: "pipe",
      });
    }
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it("serves course HTML and health endpoint", async () => {
    app = await previewCommands.createPreviewServer(
      fixturePath("minimal-valid"),
    );
    const home = await app.inject({ method: "GET", url: "/" });
    expect(home.statusCode).toBe(200);
    expect(home.body).toContain("Minimal Valid Course");
    expect(home.body).toContain("lxpack-app");

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.json()).toEqual({ status: "ok" });
  });
});

describe("startPreview", () => {
  it("logs validation warnings for invalid courses", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { app, validation } = await previewCommands.startPreview(
      fixturePath("missing-markdown"),
    );
    expect(validation.valid).toBe(false);
    expect(log.mock.calls.some((c) => String(c[0]).includes("Warning"))).toBe(
      true,
    );
    await app.close();
  });
});

describe("logPreviewStarted", () => {
  it("prints server URL and hints", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    previewCommands.logPreviewStarted("127.0.0.1", 3999);
    expect(log.mock.calls.some((c) => String(c[0]).includes("running"))).toBe(
      true,
    );
    expect(log.mock.calls.some((c) => String(c[0]).includes("3999"))).toBe(true);
  });
});

describe("previewCommand", () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
  });

  it("uses optional dependency overrides when deps are omitted", async () => {
    const listen = vi.fn().mockResolvedValue(undefined);
    await previewCommands.previewCommand(
      { port: 4003, host: "127.0.0.1" },
      {
        findCourseDir: () => fixturePath("minimal-valid"),
        startPreview: async () => ({
          app: { listen, close: vi.fn() },
          validation: { valid: true, issues: [] },
        }),
        logPreviewStarted: vi.fn(),
      },
    );
    expect(listen).toHaveBeenCalled();
  });

  it("uses default dependency resolution when deps are empty", async () => {
    const listen = vi.fn().mockResolvedValue(undefined);
    await previewCommands.previewCommand(
      { port: 4001, host: "127.0.0.1" },
      {
        findCourseDir: () => fixturePath("minimal-valid"),
        startPreview: async () => ({
          app: { listen, close: vi.fn() },
          validation: { valid: true, issues: [] },
        }),
        logPreviewStarted: vi.fn(),
      },
    );
    expect(listen).toHaveBeenCalled();
  });

  it("uses default port and host when options omit them", async () => {
    const listen = vi.fn().mockResolvedValue(undefined);
    await previewCommands.previewCommand(
      {},
      {
        findCourseDir: () => fixturePath("minimal-valid"),
        startPreview: async () => ({
          app: { listen, close: vi.fn() },
          validation: { valid: true, issues: [] },
        }),
        logPreviewStarted: vi.fn(),
      },
    );
    expect(listen).toHaveBeenCalledWith({ port: 3847, host: "127.0.0.1" });
  });

  it("starts the preview server via injected dependencies", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const listen = vi.fn().mockResolvedValue(undefined);
    const logStarted = vi.fn();

    await previewCommands.previewCommand(
      { port: 3999, host: "127.0.0.1" },
      {
        findCourseDir: () => fixturePath("minimal-valid"),
        startPreview: vi.fn().mockResolvedValue({
          app: { listen, close: vi.fn() },
          validation: { valid: true, issues: [] },
        }),
        logPreviewStarted: logStarted,
      },
    );

    expect(listen).toHaveBeenCalledWith({ port: 3999, host: "127.0.0.1" });
    expect(logStarted).toHaveBeenCalledWith("127.0.0.1", 3999);
    expect(log.mock.calls.length).toBe(0);
  });
});
