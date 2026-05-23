import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { previewCommand } from "./commands/preview.js";
import { validateCommand } from "./commands/validate.js";
import { buildCommand } from "./commands/build.js";

export function createCliProgram(): Command {
  const program = new Command();

  program
    .name("lxpack")
    .description("AI-native learning experience compiler")
    .version("0.1.0");

  program
    .command("init")
    .description("Create a new LXPack course project")
    .argument("<project-name>", "Name of the course project")
    .option("-d, --dir <path>", "Output directory (defaults to project name)")
    .action(async (projectName: string, options: { dir?: string }) => {
      await initCommand(projectName, options);
    });

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
      "Export target: scorm12, standalone",
      "scorm12",
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

/* v8 ignore start -- entry guard: auto-run CLI only outside test */
const isTestEnv =
  (typeof import.meta !== "undefined" &&
    "vitest" in import.meta &&
    Boolean(import.meta.vitest)) ||
  process.env.VITEST === "true";

if (!isTestEnv) {
  await runCli();
}
/* v8 ignore end */
