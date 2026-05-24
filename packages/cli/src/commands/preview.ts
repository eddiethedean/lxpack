import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import pc from "picocolors";
import type { CourseManifest } from "@lxpack/validators";
import type { RuntimeAssessmentBundle } from "@lxpack/validators";
import { validateCourse, buildRuntimeAssessmentBundle } from "@lxpack/validators";
import { safeJsonForHtml } from "@lxpack/scorm";
import {
  escapeHtml,
  findCourseDir,
  getRuntimeAssetsDir,
  loadRuntimeStyles,
  readComponentsBundle,
} from "../utils.js";

export async function loadPreviewStyles(
  assetsDir = getRuntimeAssetsDir(),
): Promise<string> {
  return loadRuntimeStyles(assetsDir);
}

export function buildPreviewConfig(
  manifest: CourseManifest,
  assessmentBundle?: RuntimeAssessmentBundle,
): string {
  return safeJsonForHtml({
    manifest,
    baseUrl: "/course",
    mode: "preview",
    ...(assessmentBundle
      ? {
          assessments: assessmentBundle.assessments,
          answerKeys: assessmentBundle.answerKeys,
          assessmentConfigs: assessmentBundle.configs,
          assessmentFeedback: assessmentBundle.feedback,
        }
      : {}),
  });
}

export async function createPreviewServer(
  courseDir: string,
  manifest: CourseManifest,
  assessmentBundle?: RuntimeAssessmentBundle,
): Promise<FastifyInstance> {
  const runtimeDir = getRuntimeAssetsDir();

  const app = Fastify({ logger: false });

  await app.register(fastifyStatic, {
    root: courseDir,
    prefix: "/course/",
    decorateReply: false,
  });

  await app.register(fastifyStatic, {
    root: runtimeDir,
    prefix: "/runtime/",
    decorateReply: false,
  });

  const stylesCss = await loadPreviewStyles(runtimeDir);
  const config = buildPreviewConfig(manifest, assessmentBundle);
  const componentsJs = await readComponentsBundle();

  if (componentsJs) {
    app.get("/runtime/components.js", async (_req, reply) => {
      return reply.type("application/javascript").send(componentsJs);
    });
  }

  app.get("/", async (_req, reply) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(manifest.title)} — Preview</title>
  <style>${stylesCss}</style>
</head>
<body>
  <div id="lxpack-app"></div>
  <script type="application/json" id="lxpack-config">${config}</script>
  <script>
    window.__LXPACK_CONFIG__ = JSON.parse(document.getElementById('lxpack-config').textContent);
  </script>
  ${componentsJs ? '<script type="module" src="/runtime/components.js"></script>' : ""}
  <script type="module" src="/runtime/client.js"></script>
</body>
</html>`;

    return reply.type("text/html").send(html);
  });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}

export async function startPreview(
  courseDir: string,
  _options: { port?: number; host?: string } = {},
): Promise<{
  app: FastifyInstance;
  validation: Awaited<ReturnType<typeof validateCourse>>;
}> {
  const validation = await validateCourse(courseDir);

  if (!validation.manifest) {
    console.error(pc.red("Cannot preview: course manifest is invalid"));
    for (const issue of validation.issues) {
      console.error(`  ${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }

  if (!validation.valid) {
    console.error(pc.red("Cannot preview: course validation failed"));
    for (const issue of validation.issues) {
      console.error(`  ${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }

  const assessmentBundle = await buildRuntimeAssessmentBundle(
    courseDir,
    validation.manifest,
  );

  const app = await createPreviewServer(
    courseDir,
    validation.manifest,
    assessmentBundle,
  );
  return { app, validation };
}

export interface PreviewCommandDeps {
  findCourseDir?: typeof findCourseDir;
  startPreview?: typeof startPreview;
  logPreviewStarted?: typeof logPreviewStarted;
}

export function resolvePreviewDeps(
  deps?: PreviewCommandDeps,
): Required<PreviewCommandDeps> {
  return {
    findCourseDir: deps?.findCourseDir ?? findCourseDir,
    startPreview: deps?.startPreview ?? startPreview,
    logPreviewStarted: deps?.logPreviewStarted ?? logPreviewStarted,
  };
}

export async function previewCommand(
  options: {
    port?: number;
    host?: string;
  },
  deps?: PreviewCommandDeps,
): Promise<void> {
  const {
    findCourseDir: resolveCourseDir,
    startPreview: resolveStartPreview,
    logPreviewStarted: resolveLogStarted,
  } = resolvePreviewDeps(deps);

  const courseDir = resolveCourseDir();
  const port = options.port ?? 3847;
  const host = options.host ?? "127.0.0.1";

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(pc.red(`Invalid port: ${port}`));
    process.exit(1);
  }

  const { app } = await resolveStartPreview(courseDir, options);

  try {
    await app.listen({ port, host });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("EADDRINUSE")) {
      console.error(pc.red(`Port ${port} is already in use`));
    } else {
      console.error(pc.red(`Failed to start preview server: ${message}`));
    }
    process.exit(1);
  }

  resolveLogStarted(host, port);
}

export function logPreviewStarted(host: string, port: number): void {
  console.log(pc.green(`✓ Preview server running`));
  console.log(`  ${pc.cyan(`http://${host}:${port}`)}`);
  console.log();
  console.log(pc.dim("Press Ctrl+C to stop"));
}
