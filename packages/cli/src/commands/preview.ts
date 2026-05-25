import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import pc from "picocolors";
import type { CourseManifest } from "@lxpack/validators";
import type { RuntimeAssessmentBundle } from "@lxpack/validators";
import { validateCourse } from "@lxpack/validators";
import { loadValidatedCourseContext } from "../lib/validated-course.js";
import { buildLearnerPageHtml, safeJsonForHtml } from "@lxpack/scorm";
import {
  findCourseDir,
  getRuntimeAssetsDir,
  loadLxpackConfig,
  loadRuntimeStyles,
  readComponentsBundle,
} from "../utils.js";
import { getCourseActivityIri } from "@lxpack/validators";

export async function loadPreviewStyles(
  assetsDir = getRuntimeAssetsDir(),
): Promise<string> {
  return loadRuntimeStyles(assetsDir);
}

export function buildPreviewConfig(
  manifest: CourseManifest,
  assessmentBundle?: RuntimeAssessmentBundle,
  options?: {
    activityIri?: string;
    xapiPreview?: { logStatements?: boolean; mockLrs?: boolean };
  },
): string {
  return safeJsonForHtml({
    manifest,
    baseUrl: "/course",
    mode: "preview",
    ...(options?.activityIri ? { activityIri: options.activityIri } : {}),
    ...(options?.xapiPreview
      ? {
          xapi: {
            previewLog: options.xapiPreview.logStatements ?? true,
            mockLrs: options.xapiPreview.mockLrs ?? true,
          },
        }
      : {}),
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

  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] ?? "";
    if (path.startsWith("/course/assessments/")) {
      return reply.code(404).send("Not found");
    }
  });

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
  const lxpackConfig = await loadLxpackConfig(courseDir);
  const activityIri = getCourseActivityIri(manifest);
  const config = buildPreviewConfig(manifest, assessmentBundle, {
    activityIri,
    xapiPreview: lxpackConfig?.xapi?.preview,
  });
  const componentsJs = await readComponentsBundle();

  if (componentsJs) {
    app.get("/runtime/components.js", async (_req, reply) => {
      return reply.type("application/javascript").send(componentsJs);
    });
  }

  app.get("/", async (_req, reply) => {
    const html = buildLearnerPageHtml({
      title: `${manifest.title} — Preview`,
      runtimeCss: stylesCss,
      configJson: config,
      runtimeScript: "/runtime/client.js",
      componentsScript: componentsJs ? "/runtime/components.js" : undefined,
    });

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
  const ctx = await loadValidatedCourseContext(courseDir);

  if (!ctx) {
    const validation = await validateCourse(courseDir);
    if (!validation.manifest) {
      console.error(pc.red("Cannot preview: course manifest is invalid"));
      for (const issue of validation.issues) {
        console.error(`  ${issue.path}: ${issue.message}`);
      }
      process.exit(1);
    }
    console.error(pc.red("Cannot preview: course validation failed"));
    for (const issue of validation.issues) {
      console.error(`  ${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }

  const { validation, manifest, assessmentBundle } = ctx;

  const app = await createPreviewServer(
    courseDir,
    manifest,
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
