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

describe("buildPreviewConfig", () => {
  it("embeds previewScormMode when not local", async () => {
    const { loadCourseManifest } = await import("./utils.js");
    const manifest = await loadCourseManifest(fixturePath("minimal-valid"));
    const json = previewCommands.buildPreviewConfig(manifest, undefined, {
      previewScormMode: "scorm12",
    });
    expect(json).toContain('"previewScormMode":"scorm12"');
  });

  it("omits previewScormMode for local default", async () => {
    const { loadCourseManifest } = await import("./utils.js");
    const manifest = await loadCourseManifest(fixturePath("minimal-valid"));
    const json = previewCommands.buildPreviewConfig(manifest, undefined, {
      previewScormMode: "local",
    });
    expect(json).not.toContain("previewScormMode");
  });

  it("includes assessment bundles when provided", async () => {
    const { loadCourseManifest } = await import("./utils.js");
    const manifest = await loadCourseManifest(fixturePath("minimal-valid"));
    const { buildRuntimeAssessmentBundle } = await import("@lxpack/validators");
    const bundle = await buildRuntimeAssessmentBundle(
      fixturePath("minimal-valid"),
      manifest,
    );
    const json = previewCommands.buildPreviewConfig(manifest, bundle);
    expect(json).toContain('"assessments"');
    expect(json).toContain('"answerKeys"');
    expect(json).not.toContain('"correct"');
  });
});

describe("startPreview with assessments", () => {
  it("builds a preview server for valid courses with quizzes", async () => {
    const { app, validation } = await previewCommands.startPreview(
      fixturePath("minimal-valid"),
    );
    expect(validation.valid).toBe(true);
    const home = await app.inject({ method: "GET", url: "/" });
    expect(home.body).toContain("lxpack-config");
    expect(home.body).not.toContain('"correct"');
    await app.close();
  });
});

describe("loadPreviewStyles", () => {
  it("returns fallback CSS when the styles file is missing", async () => {
    const css = await previewCommands.loadPreviewStyles("/nonexistent");
    expect(css).toContain("body { margin: 0; }");
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
    const components = `${REPO_ROOT}/packages/components/dist/bundle.js`;
    if (!existsSync(components)) {
      execSync("pnpm --filter @lxpack/components build", {
        cwd: REPO_ROOT,
        stdio: "pipe",
      });
    }
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it("blocks path traversal to course.yaml", async () => {
    const { loadCourseManifest } = await import("./utils.js");
    const manifest = await loadCourseManifest(fixturePath("minimal-valid"));
    app = await previewCommands.createPreviewServer(
      fixturePath("minimal-valid"),
      manifest,
    );
    const res = await app.inject({
      method: "GET",
      url: "/course/lessons/../../course.yaml",
    });
    expect(res.statusCode).toBe(404);
  });

  it("blocks course.yaml and lxpack.config.json", async () => {
    const { loadCourseManifest } = await import("./utils.js");
    const manifest = await loadCourseManifest(fixturePath("minimal-valid"));
    app = await previewCommands.createPreviewServer(
      fixturePath("minimal-valid"),
      manifest,
    );
    const courseYaml = await app.inject({
      method: "GET",
      url: "/course/course.yaml",
    });
    expect(courseYaml.statusCode).toBe(404);
    const config = await app.inject({
      method: "GET",
      url: "/course/lxpack.config.json",
    });
    expect(config.statusCode).toBe(404);
  });

  it("blocks direct access to author assessment YAML", async () => {
    const { loadCourseManifest } = await import("./utils.js");
    const manifest = await loadCourseManifest(fixturePath("minimal-valid"));
    app = await previewCommands.createPreviewServer(
      fixturePath("minimal-valid"),
      manifest,
    );
    const blocked = await app.inject({
      method: "GET",
      url: "/course/assessments/quiz.yaml",
    });
    expect(blocked.statusCode).toBe(404);
  });

  it("serves course HTML and health endpoint", async () => {
    const { loadCourseManifest } = await import("./utils.js");
    const manifest = await loadCourseManifest(fixturePath("minimal-valid"));
    app = await previewCommands.createPreviewServer(
      fixturePath("minimal-valid"),
      manifest,
    );
    const home = await app.inject({ method: "GET", url: "/" });
    expect(home.statusCode).toBe(200);
    expect(home.body).toContain("Minimal Valid Course");
    expect(home.body).toContain("lxpack-app");

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.json()).toEqual({ status: "ok" });
  });

  it("serves the components bundle route when available", async () => {
    const { loadCourseManifest } = await import("./utils.js");
    const manifest = await loadCourseManifest(fixturePath("minimal-valid"));
    app = await previewCommands.createPreviewServer(
      fixturePath("minimal-valid"),
      manifest,
    );
    const home = await app.inject({ method: "GET", url: "/" });
    expect(home.body).toContain("/runtime/components.js");

    const components = await app.inject({
      method: "GET",
      url: "/runtime/components.js",
    });
    expect(components.statusCode).toBe(200);
    expect(components.body).toContain("__LXPACK_COMPONENTS__");
  });
});

describe("startPreview", () => {
  it("exits when course validation fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      previewCommands.startPreview(fixturePath("missing-markdown")),
    ).rejects.toThrow("exit:1");
    expect(
      error.mock.calls.some((c) => String(c[0]).includes("validation failed")),
    ).toBe(true);
    exit.mockRestore();
  });

  it("exits when the manifest cannot be parsed", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      previewCommands.startPreview(fixturePath("invalid-yaml")),
    ).rejects.toThrow("exit:1");
    expect(error.mock.calls.some((c) => String(c[0]).includes("invalid"))).toBe(
      true,
    );
    exit.mockRestore();
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

  it("rejects invalid preview ports", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      previewCommands.previewCommand(
        { port: 70000, host: "127.0.0.1" },
        {
          findCourseDir: () => fixturePath("minimal-valid"),
          startPreview: async () => ({
            app: { listen: vi.fn(), close: vi.fn() },
            validation: { valid: true, issues: [] },
          }),
          logPreviewStarted: vi.fn(),
        },
      ),
    ).rejects.toThrow("exit:1");
    expect(error.mock.calls[0]?.[0]).toContain("70000");
    exit.mockRestore();
  });

  it("reports port-in-use errors", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      previewCommands.previewCommand(
        { port: 4010, host: "127.0.0.1" },
        {
          findCourseDir: () => fixturePath("minimal-valid"),
          startPreview: async () => ({
            app: {
              listen: vi.fn().mockRejectedValue(new Error("EADDRINUSE")),
              close: vi.fn(),
            },
            validation: { valid: true, issues: [] },
          }),
          logPreviewStarted: vi.fn(),
        },
      ),
    ).rejects.toThrow("exit:1");
    expect(error.mock.calls.some((c) => String(c[0]).includes("in use"))).toBe(
      true,
    );
    exit.mockRestore();
  });

  it("reports generic preview startup failures", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      previewCommands.previewCommand(
        { port: 4011, host: "127.0.0.1" },
        {
          findCourseDir: () => fixturePath("minimal-valid"),
          startPreview: async () => ({
            app: {
              listen: vi.fn().mockRejectedValue("network down"),
              close: vi.fn(),
            },
            validation: { valid: true, issues: [] },
          }),
          logPreviewStarted: vi.fn(),
        },
      ),
    ).rejects.toThrow("exit:1");
    expect(
      error.mock.calls.some((c) =>
        String(c[0]).includes("Failed to start preview server"),
      ),
    ).toBe(true);
    exit.mockRestore();
  });
});
