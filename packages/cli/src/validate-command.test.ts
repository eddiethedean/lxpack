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

  it("prints warning severity issues", async () => {
    process.chdir(fixturePath("minimal-valid"));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code ?? 0}`);
      });

    const validators = await import("@lxpack/validators");
    vi.spyOn(validators, "validateCourse").mockResolvedValue({
      valid: true,
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
