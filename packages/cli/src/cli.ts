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
    .option(
      "-t, --target <target>",
      "Validate export requirements (uses lxpack.config.json defaultTarget when omitted)",
    )
    .action(async (options: { port: string; host: string; target?: string }) => {
      await previewCommand({
        port: Number(options.port),
        host: options.host,
        target: options.target,
      });
    });

  program
    .command("validate")
    .description("Validate course structure and assets")
    .option(
      "-t, --target <target>",
      "Export target for validation (scorm12, scorm2004, standalone, xapi, cmi5); xapi/cmi5 rules apply when selected or set as defaultTarget",
    )
    .action(async (options: { target?: string }) => {
      await validateCommand(options);
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
    .option(
      "--lessonkit <path>",
      "Build from lessonkit.json interchange (use with --spa-lesson or --spa-dist)",
    )
    .option(
      "--spa-lesson <id=path>",
      "SPA lesson id and absolute dist path (repeatable; used with --lessonkit)",
      (value: string, previous: string[] = []) => [...previous, value],
    )
    .option(
      "--spa-dist <path>",
      "SPA dist folder when interchange has a single lesson",
    )
    .action(
      async (options: {
        target?: string;
        output?: string;
        dir?: boolean;
        lessonkit?: string;
        spaLesson?: string[];
        spaDist?: string;
      }) => {
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
