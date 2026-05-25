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
