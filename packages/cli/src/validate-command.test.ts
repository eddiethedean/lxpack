import { afterEach, describe, expect, it, vi } from "vitest";
import { fixturePath } from "../../test/helpers/paths.js";
import { validateCommand } from "./commands/validate.js";

describe("validateCommand", () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
  });

  it("exits 0 when course is valid", async () => {
    process.chdir(fixturePath("minimal-valid"));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(validateCommand()).rejects.toThrow("exit:0");
    expect(log.mock.calls.some((c) => String(c[0]).includes("passed"))).toBe(
      true,
    );
    exit.mockRestore();
  });

  it("exits 1 and prints issues when course is invalid", async () => {
    process.chdir(fixturePath("missing-markdown"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(validateCommand()).rejects.toThrow("exit:1");
    exit.mockRestore();
  });

  it("exits 1 for invalid --target", async () => {
    process.chdir(fixturePath("minimal-valid"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      validateCommand({ target: "not-a-target" }),
    ).rejects.toThrow("exit:1");
    expect(error.mock.calls.some((c) => String(c[0]).includes("Invalid target"))).toBe(
      true,
    );
    exit.mockRestore();
  });

  it("validates xapi export when defaultTarget is xapi without --target", async () => {
    const { mkdtemp, writeFile, cp, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const dir = await mkdtemp(join(tmpdir(), "lxpack-validate-xapi-"));
    await cp(fixturePath("xapi-valid"), dir, { recursive: true });
    await writeFile(
      join(dir, "lxpack.config.json"),
      JSON.stringify({ exports: { defaultTarget: "xapi" } }),
    );
    process.chdir(dir);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(validateCommand()).rejects.toThrow("exit:0");
    expect(log.mock.calls.some((c) => String(c[0]).includes("passed"))).toBe(
      true,
    );
    exit.mockRestore();
    await rm(dir, { recursive: true, force: true });
  });

  it("fails xapi validation when defaultTarget is xapi and activityIri is missing", async () => {
    const { mkdtemp, writeFile, cp, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const dir = await mkdtemp(join(tmpdir(), "lxpack-validate-xapi-fail-"));
    await cp(fixturePath("missing-xapi-iri"), dir, { recursive: true });
    await writeFile(
      join(dir, "lxpack.config.json"),
      JSON.stringify({ exports: { defaultTarget: "xapi" } }),
    );
    process.chdir(dir);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(validateCommand()).rejects.toThrow("exit:1");
    exit.mockRestore();
    await rm(dir, { recursive: true, force: true });
  });

  it("exits when lxpack.config.json is invalid", async () => {
    const { mkdtemp, writeFile, cp, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const dir = await mkdtemp(join(tmpdir(), "lxpack-validate-bad-config-"));
    await cp(fixturePath("minimal-valid"), dir, { recursive: true });
    await writeFile(join(dir, "lxpack.config.json"), "{ not json");
    process.chdir(dir);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(validateCommand()).rejects.toThrow("exit:1");
    expect(
      error.mock.calls.some((c) =>
        String(c[0]).includes("lxpack.config.json"),
      ),
    ).toBe(true);
    exit.mockRestore();
    await rm(dir, { recursive: true, force: true });
  });

  it("fails xapi target validation when activityIri is missing", async () => {
    process.chdir(fixturePath("missing-xapi-iri"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(validateCommand({ target: "xapi" })).rejects.toThrow("exit:1");
    exit.mockRestore();
  });

  it("validates lessonkit interchange with --spa-dist for a single lesson", async () => {
    const { mkdtemp, writeFile, mkdir, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const workDir = await mkdtemp(join(tmpdir(), "lxpack-validate-lk-dist-"));
    const spaDir = join(workDir, "spa-dist");
    await mkdir(spaDir, { recursive: true });
    await writeFile(join(spaDir, "index.html"), "<html></html>");
    await writeFile(
      join(workDir, "lessonkit.json"),
      JSON.stringify({
        format: "lessonkit",
        version: "1",
        lessons: [{ id: "only", type: "spa", path: "dist/only" }],
      }),
    );
    process.chdir(workDir);
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      validateCommand({
        lessonkit: join(workDir, "lessonkit.json"),
        spaDist: spaDir,
      }),
    ).rejects.toThrow("exit:0");
    exit.mockRestore();
    await rm(workDir, { recursive: true, force: true });
  });

  it("validates lessonkit interchange with --spa-lesson", async () => {
    const { mkdtemp, writeFile, mkdir, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const workDir = await mkdtemp(join(tmpdir(), "lxpack-validate-lk-"));
    const spaDir = join(workDir, "spa-dist");
    await mkdir(spaDir, { recursive: true });
    await writeFile(join(spaDir, "index.html"), "<html></html>");
    await writeFile(
      join(workDir, "lessonkit.json"),
      JSON.stringify({
        format: "lessonkit",
        version: "1",
        course: { title: "LK Validate" },
        lessons: [{ id: "spa1", type: "spa", path: "dist/spa1" }],
      }),
    );
    process.chdir(workDir);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      validateCommand({
        lessonkit: join(workDir, "lessonkit.json"),
        spaLesson: [`spa1=${spaDir}`],
      }),
    ).rejects.toThrow("exit:0");
    expect(log.mock.calls.some((c) => String(c[0]).includes("passed"))).toBe(
      true,
    );
    exit.mockRestore();
    await rm(workDir, { recursive: true, force: true });
  });

  it("exits when lessonkit materialize fails", async () => {
    const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const workDir = await mkdtemp(join(tmpdir(), "lxpack-validate-lk-mat-"));
    const spaDir = join(workDir, "empty-spa");
    await writeFile(
      join(workDir, "lessonkit.json"),
      JSON.stringify({
        format: "lessonkit",
        version: "1",
        lessons: [{ id: "spa1", type: "spa", path: "dist/spa1" }],
      }),
    );
    process.chdir(workDir);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      validateCommand({
        lessonkit: join(workDir, "lessonkit.json"),
        spaLesson: [`spa1=${spaDir}`],
      }),
    ).rejects.toThrow("exit:1");
    expect(log.mock.calls.some((c) => String(c[0]).includes("failed"))).toBe(
      true,
    );
    exit.mockRestore();
    await rm(workDir, { recursive: true, force: true });
  });

  it("exits when lxpack.config.json is invalid during lessonkit validate", async () => {
    const { mkdtemp, writeFile, mkdir, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const workDir = await mkdtemp(join(tmpdir(), "lxpack-validate-lk-cfg-"));
    const spaDir = join(workDir, "spa");
    await mkdir(spaDir, { recursive: true });
    await writeFile(join(spaDir, "index.html"), "<html></html>");
    await writeFile(join(workDir, "lxpack.config.json"), "{ bad");
    await writeFile(
      join(workDir, "lessonkit.json"),
      JSON.stringify({
        format: "lessonkit",
        version: "1",
        lessons: [{ id: "spa1", type: "spa", path: "dist/spa1" }],
      }),
    );
    process.chdir(workDir);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      validateCommand({
        lessonkit: join(workDir, "lessonkit.json"),
        spaLesson: [`spa1=${spaDir}`],
      }),
    ).rejects.toThrow("exit:1");
    expect(
      error.mock.calls.some((c) => String(c[0]).includes("lxpack.config.json")),
    ).toBe(true);
    exit.mockRestore();
    await rm(workDir, { recursive: true, force: true });
  });

  it("exits when lessonkit interchange file is invalid", async () => {
    const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const workDir = await mkdtemp(join(tmpdir(), "lxpack-validate-lk-bad-"));
    await writeFile(join(workDir, "lessonkit.json"), "{ not json");
    process.chdir(workDir);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      validateCommand({ lessonkit: join(workDir, "lessonkit.json") }),
    ).rejects.toThrow("exit:1");
    expect(
      error.mock.calls.some((c) => String(c[0]).includes("invalid lessonkit")),
    ).toBe(true);
    exit.mockRestore();
    await rm(workDir, { recursive: true, force: true });
  });

  it("exits when lessonkit spa-lesson id is unknown", async () => {
    const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const workDir = await mkdtemp(join(tmpdir(), "lxpack-validate-lk-unk-"));
    await writeFile(
      join(workDir, "lessonkit.json"),
      JSON.stringify({
        format: "lessonkit",
        version: "1",
        lessons: [{ id: "spa1", type: "spa", path: "dist/spa1" }],
      }),
    );
    process.chdir(workDir);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      validateCommand({
        lessonkit: join(workDir, "lessonkit.json"),
        spaLesson: ["unknown=/tmp/dist"],
      }),
    ).rejects.toThrow("exit:1");
    expect(error.mock.calls.some((c) => String(c[0]).includes("Unknown"))).toBe(
      true,
    );
    exit.mockRestore();
    await rm(workDir, { recursive: true, force: true });
  });

  it("exits when lessonkit spa-lesson id is missing", async () => {
    const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const workDir = await mkdtemp(join(tmpdir(), "lxpack-validate-lk-miss-"));
    await writeFile(
      join(workDir, "lessonkit.json"),
      JSON.stringify({
        format: "lessonkit",
        version: "1",
        lessons: [{ id: "spa1", type: "spa", path: "dist/spa1" }],
      }),
    );
    process.chdir(workDir);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    await expect(
      validateCommand({
        lessonkit: join(workDir, "lessonkit.json"),
      }),
    ).rejects.toThrow("exit:1");
    expect(error.mock.calls.some((c) => String(c[0]).includes("Missing"))).toBe(
      true,
    );
    exit.mockRestore();
    await rm(workDir, { recursive: true, force: true });
  });

  it("prints warning severity issues", async () => {
    process.chdir(fixturePath("minimal-valid"));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    const api = await import("@lxpack/api");
    vi.spyOn(api, "validateCourse").mockResolvedValue({
      ok: true,
      manifest: {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
      },
      issues: [
        {
          path: "warn",
          message: "Minor issue",
          severity: "warning",
        },
      ],
    });

    await expect(validateCommand()).rejects.toThrow("exit:0");
    expect(log.mock.calls.some((c) => String(c[0]).includes("!"))).toBe(true);
    exit.mockRestore();
  });
});
