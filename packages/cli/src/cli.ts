import { Command } from "commander";
import pc from "picocolors";
import { initCommand } from "./commands/init.js";
import { previewCommand } from "./commands/preview.js";
import { validateCommand } from "./commands/validate.js";
import { buildCommand } from "./commands/build.js";
import { getCliVersion } from "./utils.js";

export function createCliProgram(): Command {
  const program = new Command();

  program
    .name("lxpack")
    .description("AI-native learning experience compiler")
    .version(getCliVersion());

  program
    .command("init")
    .description("Create a new LXPack course project")
    .argument("<project-name>", "Name of the course project")
    .option("-d, --dir <path>", "Output directory (defaults to project name)")
    .option("-f, --force", "Overwrite existing files")
    .action(
      async (
        projectName: string,
        options: { dir?: string; force?: boolean },
      ) => {
        await initCommand(projectName, options);
      },
    );

  program
    .command("preview")
    .description("Start local preview server")
    .option("-p, --port <port>", "Port number", "3847")
    .option("-H, --host <host>", "Host address", "127.0.0.1")
    .action(async (options: { port: string; host: string }) => {
      await previewCommand({
        port: Number(options.port),
        host: options.host,
      });
    });

  program
    .command("validate")
    .description("Validate course structure and assets")
    .action(async () => {
      await validateCommand();
    });

  program
    .command("build")
    .description("Build LMS-compatible package")
    .option(
      "-t, --target <target>",
      "Export target: scorm12, scorm2004, standalone, xapi, cmi5",
      undefined,
    )
    .option("-o, --output <path>", "Output file or directory path")
    .option("--dir", "Output as directory instead of ZIP")
    .action(
      async (options: { target?: string; output?: string; dir?: boolean }) => {
        await buildCommand(options);
      },
    );

  return program;
}

export async function runCli(argv = process.argv): Promise<void> {
  const program = createCliProgram();
  await program.parseAsync(argv);
}

export function printCliError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(pc.red(`Error: ${message}`));
}

/* v8 ignore start -- entry guard: auto-run CLI only outside test */
const isTestEnv = process.env.VITEST === "true";

if (!isTestEnv) {
  try {
    await runCli();
  } catch (err) {
    printCliError(err);
    process.exit(1);
  }
}
/* v8 ignore end */

export type { LxpackConfig } from "./utils.js";
