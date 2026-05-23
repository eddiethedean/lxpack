import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { execSync } from "node:child_process";
import { fixturePath, REPO_ROOT } from "../../test/helpers/paths.js";

vi.mock("./commands/preview.js", () => ({
  previewCommand: vi.fn().mockResolvedValue(undefined),
  createPreviewServer: vi.fn(),
  startPreview: vi.fn(),
  loadPreviewStyles: vi.fn(),
  logPreviewStarted: vi.fn(),
}));

vi.mock("./commands/validate.js", () => ({
  validateCommand: vi.fn().mockResolvedValue(undefined),
}));

const { createCliProgram } = await import("./cli.js");
const { previewCommand } = await import("./commands/preview.js");
const { validateCommand } = await import("./commands/validate.js");

describe("cli program actions", () => {
  beforeAll(() => {
    const client = `${REPO_ROOT}/packages/runtime/dist/client.js`;
    if (!existsSync(client)) {
      execSync("pnpm --filter @lxpack/runtime build", {
        cwd: REPO_ROOT,
        stdio: "pipe",
      });
    }
  });

  it("invokes previewCommand from the preview subcommand", async () => {
    const program = createCliProgram();
    const preview = program.commands.find((c) => c.name() === "preview");
    await preview?.parseAsync(["-p", "4000"], { from: "user" });
    expect(previewCommand).toHaveBeenCalledWith({
      port: 4000,
      host: "127.0.0.1",
    });
  });

  it("invokes validateCommand from the validate subcommand", async () => {
    const program = createCliProgram();
    const validate = program.commands.find((c) => c.name() === "validate");
    await validate?.parseAsync([], { from: "user" });
    expect(validateCommand).toHaveBeenCalled();
  });

  it("invokes buildCommand from the build subcommand", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-cli-build-"));
    const { cp } = await import("node:fs/promises");
    await cp(fixturePath("minimal-valid"), join(dir, "course"), {
      recursive: true,
    });

    const program = createCliProgram();
    const build = program.commands.find((c) => c.name() === "build");
    const cwd = process.cwd();
    process.chdir(join(dir, "course"));
    try {
      await build?.parseAsync(["-t", "standalone"], { from: "user" });
      expect(
        existsSync(
          join(dir, "course", ".lxpack", "minimal-valid-course-standalone.zip"),
        ),
      ).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });
});
