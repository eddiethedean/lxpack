import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import pc from "picocolors";
import type { CourseManifest } from "@lxpack/validators";
import type { RuntimeAssessmentBundle } from "@lxpack/validators";
import {
  materializeLessonkitProject,
  validateCourseWithInterchange,
  buildRuntimeAssessmentBundleFromData,
  buildRuntimeAssessmentBundleFromParsed,
  resolvePackageAssessments,
  formatErrorMessage,
  type ValidationResult,
} from "@lxpack/validators";
import {
  buildSpaDirsFromInterchange,
  loadLessonkitInterchangeFile,
  parseSpaLessonOption,
  resolveLessonkitConfigDir,
  validateSpaDirsForInterchange,
} from "../lib/lessonkit-build.js";
import {
  loadValidatedCourseContext,
  printValidationIssues,
} from "../lib/validated-course.js";
import { buildLearnerPageHtml, safeJsonForHtml } from "@lxpack/scorm";
import {
  findCourseDir,
  getRuntimeAssetsDir,
  loadLearnerStyles,
  loadLxpackConfig,
  readComponentsBundle,
} from "../utils.js";
import { getCourseActivityIri } from "@lxpack/validators";
import {
  buildPreviewBlockedRels,
  shouldBlockPreviewCourseRequest,
} from "../lib/preview-paths.js";
import { resolveExportTarget } from "../lib/resolve-export-target.js";
import type { ExportTarget } from "@lxpack/scorm";
import {
  formatInvalidTargetMessage,
  isValidExportTarget,
} from "../lib/targets.js";

export async function loadPreviewStyles(
  assetsDir = getRuntimeAssetsDir(),
): Promise<string> {
  return loadLearnerStyles(assetsDir);
}

export function buildPreviewConfig(
  manifest: CourseManifest,
  assessmentBundle?: RuntimeAssessmentBundle,
  options?: {
    activityIri?: string;
    previewScormMode?: "local" | "scorm12" | "scorm2004";
    xapiPreview?: { logStatements?: boolean; mockLrs?: boolean };
  },
): string {
  return safeJsonForHtml({
    manifest,
    baseUrl: "/course",
    mode: "preview",
    ...(options?.previewScormMode && options.previewScormMode !== "local"
      ? { previewScormMode: options.previewScormMode }
      : {}),
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
  const blockedRels = buildPreviewBlockedRels(manifest);

  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] ?? "";
    if (shouldBlockPreviewCourseRequest(courseDir, path, blockedRels)) {
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
  const previewScormMode = lxpackConfig?.preview?.scormMode ?? "local";
  const config = buildPreviewConfig(manifest, assessmentBundle, {
    activityIri,
    previewScormMode,
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

export async function startPreviewFromLessonkit(options: {
  lessonkitPath: string;
  spaLesson: Array<{ id: string; path: string }>;
  spaDist?: string;
  target?: string;
}): Promise<{
  app: FastifyInstance;
  validation: ValidationResult;
  courseDir: string;
  cleanup: () => Promise<void>;
}> {
  const loaded = await loadLessonkitInterchangeFile(options.lessonkitPath);
  if (!loaded.ok) {
    throw new Error(
      loaded.issues.map((i) => i.message).join("; ") || "Invalid lessonkit interchange",
    );
  }

  const spaDirs = buildSpaDirsFromInterchange(
    loaded.data,
    options.spaLesson,
    options.spaDist,
  );
  const spaDirError = validateSpaDirsForInterchange(loaded.data, spaDirs);
  if (spaDirError) {
    throw new Error(spaDirError);
  }

  const materialized = await materializeLessonkitProject({
    interchange: loaded.data,
    spaDirs,
  });

  if (!materialized.ok) {
    const err = new Error("materialize failed");
    (err as Error & { issues: typeof materialized.issues }).issues =
      materialized.issues;
    throw err;
  }

  const courseDir = materialized.courseDir;
  const cleanup = async () => {
    const { rm } = await import("node:fs/promises");
    await rm(courseDir, { recursive: true, force: true }).catch(() => {});
  };

  let config = null;
  try {
    config = await loadLxpackConfig(
      resolveLessonkitConfigDir(options.lessonkitPath),
    );
  } catch {
    /* optional lxpack.config.json */
  }
  const exportTarget = resolveExportTarget(
    options.target,
    config,
  ) as ExportTarget;
  const assessments = resolvePackageAssessments(loaded.data, loaded.data.assessments);
  const validation = await validateCourseWithInterchange(courseDir, {
    exportTarget,
    assessmentData: assessments,
    interchange: loaded.data,
  });

  if (!validation.valid || !validation.manifest) {
    const err = new Error("validation failed");
    (err as Error & { validation: ValidationResult }).validation = validation;
    throw err;
  }

  const bundleResult = assessments?.length
    ? buildRuntimeAssessmentBundleFromData(validation.manifest, assessments)
    : {
        bundle: buildRuntimeAssessmentBundleFromParsed(
          validation.parsedAssessments ?? new Map(),
        ),
        issues: [] as ValidationResult["issues"],
      };
  const assessmentBundle = bundleResult.bundle;

  const app = await createPreviewServer(
    courseDir,
    validation.manifest,
    assessmentBundle,
  );

  return { app, validation, courseDir, cleanup };
}

export async function startPreview(
  courseDir: string,
  options: { port?: number; host?: string; target?: string } = {},
): Promise<{
  app: FastifyInstance;
  validation: ValidationResult;
}> {
  let config;
  try {
    config = await loadLxpackConfig(courseDir);
  } catch (err) {
    console.error(
      pc.red(
        err instanceof Error ? err.message : String(err),
      ),
    );
    process.exit(1);
  }

  const exportTarget = resolveExportTarget(
    options.target,
    config,
  ) as ExportTarget;

  const ctx = await loadValidatedCourseContext(courseDir, { exportTarget });

  if (!ctx) {
    const validation = await validateCourseWithInterchange(courseDir, {
      exportTarget,
    });
    if (!validation.manifest) {
      console.error(pc.red("Cannot preview: course manifest is invalid"));
      for (const issue of validation.issues) {
        console.error(`  ${issue.path}: ${issue.message}`);
      }
      process.exit(1);
    }
    console.error(pc.red("Cannot preview: course validation failed"));
    printValidationIssues(validation);
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
  startPreviewFromLessonkit?: typeof startPreviewFromLessonkit;
  logPreviewStarted?: typeof logPreviewStarted;
}

export function resolvePreviewDeps(
  deps?: PreviewCommandDeps,
): Required<PreviewCommandDeps> {
  return {
    findCourseDir: deps?.findCourseDir ?? findCourseDir,
    startPreview: deps?.startPreview ?? startPreview,
    startPreviewFromLessonkit:
      deps?.startPreviewFromLessonkit ?? startPreviewFromLessonkit,
    logPreviewStarted: deps?.logPreviewStarted ?? logPreviewStarted,
  };
}

function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "127.0.0.1" ||
    h === "localhost" ||
    h === "::1" ||
    h === "[::1]"
  );
}

export async function previewCommand(
  options: {
    port?: number;
    host?: string;
    target?: string;
    lessonkit?: string;
    spaLesson?: string[];
    spaDist?: string;
  },
  deps?: PreviewCommandDeps,
): Promise<void> {
  const {
    findCourseDir: resolveCourseDir,
    startPreview: resolveStartPreview,
    startPreviewFromLessonkit: resolveStartPreviewFromLessonkit,
    logPreviewStarted: resolveLogStarted,
  } = resolvePreviewDeps(deps);

  const port = options.port ?? 3847;
  const host = options.host ?? "127.0.0.1";

  if (options.target !== undefined && !isValidExportTarget(options.target)) {
    console.error(pc.red(formatInvalidTargetMessage(options.target)));
    process.exit(1);
  }

  if (!isLoopbackHost(host)) {
    console.warn(
      pc.yellow(
        "Warning: preview is listening on a non-loopback host; embedded assessment answer keys are visible to anyone who can reach this server.",
      ),
    );
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(pc.red(`Invalid port: ${port}`));
    process.exit(1);
  }

  let app: FastifyInstance;
  let cleanup: (() => Promise<void>) | undefined;

  if (options.lessonkit) {
    const spaLessons = (options.spaLesson ?? []).map(parseSpaLessonOption);
    try {
      const result = await resolveStartPreviewFromLessonkit({
        lessonkitPath: options.lessonkit,
        spaLesson: spaLessons,
        spaDist: options.spaDist,
        target: options.target,
      });
      cleanup = result.cleanup;
      app = result.app;
    } catch (err) {
      console.error(pc.red("Cannot preview: lessonkit interchange failed"));
      const validation = (err as { validation?: ValidationResult }).validation;
      if (validation) {
        printValidationIssues(validation);
      } else if ((err as { issues?: ValidationResult["issues"] }).issues) {
        printValidationIssues({
          valid: false,
          issues: (err as { issues: ValidationResult["issues"] }).issues,
        });
      } else {
        console.error(pc.red(formatErrorMessage(err)));
      }
      process.exit(1);
    }
  } else {
    const courseDir = resolveCourseDir();
    const started = await resolveStartPreview(courseDir, options);
    app = started.app;
  }

  const onShutdown = async () => {
    await app.close();
    await cleanup?.();
  };
  process.once("SIGINT", () => {
    void onShutdown().finally(() => process.exit(0));
  });
  process.once("SIGTERM", () => {
    void onShutdown().finally(() => process.exit(0));
  });

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
