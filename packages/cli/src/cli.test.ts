import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import { createCliProgram, printCliError, runCli } from "./cli.js";

describe("cli", () => {
  it("registers all commands on the program", () => {
    const program = createCliProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toEqual(
      expect.arrayContaining(["init", "preview", "validate", "build"]),
    );
  });

  it("shows help without running subcommands", async () => {
    const program = createCliProgram();
    let helpText = "";
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as typeof process.exit);
    program.configureOutput({
      writeOut: (str) => {
        helpText += str;
      },
      writeErr: () => {},
    });
    await program.parseAsync(["node", "lxpack", "--help"], { from: "user" });
    expect(helpText).toContain("lxpack");
    expect(helpText).toContain("init");
    exit.mockRestore();
  });

  it("runs init through the program action", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-cli-init-"));
    const cwd = process.cwd();
    process.chdir(parent);
    try {
      const program = createCliProgram();
      const init = program.commands.find((c) => c.name() === "init");
      await init?.parseAsync(["demo-course", "-d", "demo-course"], {
        from: "user",
      });
      const { existsSync } = await import("node:fs");
      expect(existsSync(join(parent, "demo-course", "course.yaml"))).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });

  it("invokes runCli for a help request", async () => {
    vi.spyOn(process, "exit").mockImplementation((() => {}) as typeof process.exit);
    await expect(runCli(["node", "lxpack", "-h"])).resolves.toBeUndefined();
  });

  it("prints friendly CLI errors", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    printCliError(new Error("boom"));
    printCliError("plain");
    expect(err.mock.calls[0]?.[0]).toContain("boom");
    expect(err.mock.calls[1]?.[0]).toContain("plain");
  });
});
