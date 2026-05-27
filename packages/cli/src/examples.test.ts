import { existsSync } from "node:fs";
import { access, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import { execSync } from "node:child_process";
import { validateCourse, loadManifest } from "@lxpack/validators";
import type { ExportTarget } from "@lxpack/scorm";
import {
  EXAMPLE_COURSES,
  compiledExpectationsForTarget,
  examplePath,
} from "../../../test/helpers/examples.js";
import { REPO_ROOT } from "../../../test/helpers/paths.js";
import { buildCommand } from "./commands/build.js";
import { startPreview } from "./commands/preview.js";

async function ensureBuiltAssets(): Promise<void> {
  const client = join(REPO_ROOT, "packages/runtime/dist/client.js");
  if (!existsSync(client)) {
    execSync("pnpm --filter @lxpack/runtime build", {
      cwd: REPO_ROOT,
      stdio: "pipe",
    });
  }
  const components = join(REPO_ROOT, "packages/components/dist/bundle.js");
  if (!existsSync(components)) {
    execSync("pnpm --filter @lxpack/components build", {
      cwd: REPO_ROOT,
      stdio: "pipe",
    });
  }
}

async function createCompiledStaticServer(
  rootDir: string,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(fastifyStatic, {
    root: rootDir,
    prefix: "/",
    decorateReply: false,
  });
  return app;
}

describe("example courses", () => {
  const originalCwd = process.cwd();
  const cleanupDirs: string[] = [];
  let previewApps: FastifyInstance[] = [];

  beforeAll(async () => {
    await ensureBuiltAssets();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await Promise.all(previewApps.map((app) => app.close().catch(() => {})));
    previewApps = [];
    await Promise.all(
      cleanupDirs.map((d) => rm(d, { recursive: true, force: true }).catch(() => {})),
    );
    cleanupDirs.length = 0;
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  describe.each(EXAMPLE_COURSES)("$name (source)", ({ name, targets }) => {
    const courseDir = examplePath(name);

    it("validates as an authoring project", async () => {
      const result = await validateCourse(courseDir);
      expect(result.valid, result.issues.map((i) => i.message).join("; ")).toBe(
        true,
      );
      expect(result.manifest?.title).toBeTruthy();
    });

    it.each(targets.map((t) => [t] as const))(
      "validates for %s export",
      async (target) => {
        const result = await validateCourse(courseDir, {
          exportTarget: target as ExportTarget,
        });
        expect(
          result.valid,
          result.issues.map((i) => i.message).join("; "),
        ).toBe(true);
      },
    );

    it("starts preview and serves the course shell", async () => {
      const { app, validation } = await startPreview(courseDir);
      previewApps.push(app);
      expect(validation.valid).toBe(true);

      const home = await app.inject({ method: "GET", url: "/" });
      expect(home.statusCode).toBe(200);
      expect(home.body).toContain(validation.manifest!.title);
      expect(home.body).toContain("lxpack-app");

      const health = await app.inject({ method: "GET", url: "/health" });
      expect(health.json()).toEqual({ status: "ok" });
    });
  });

  describe.each(EXAMPLE_COURSES)("$name (compiled)", ({ name, targets }) => {
    const courseDir = examplePath(name);

    it.each(targets.map((t) => [t] as const))(
      "builds and serves a working %s package",
      async (target) => {
        const loaded = await loadManifest(courseDir);
        if (Array.isArray(loaded)) {
          throw new Error(`failed to load ${name}: ${loaded.join(", ")}`);
        }
        const { manifest } = loaded;
        const firstLessonId = manifest.lessons[0]?.id;
        expect(firstLessonId).toBeTruthy();

        const outDir = join(courseDir, ".lxpack", `test-${target}`);
        cleanupDirs.push(outDir);

        process.chdir(courseDir);
        await buildCommand({
          target: target as ExportTarget,
          dir: true,
          output: join(".lxpack", `test-${target}`),
        });

        const expectations = compiledExpectationsForTarget(
          target as ExportTarget,
          firstLessonId!,
        );

        const entryHtml = await readFile(
          join(outDir, expectations.entryRel),
          "utf-8",
        );
        expect(entryHtml).toContain(manifest.title);
        expect(entryHtml).toContain(`"mode":"${expectations.mode}"`);
        expect(entryHtml).toContain("lxpack-runtime.js");

        await expect(
          access(join(outDir, "lxpack-runtime.js")),
        ).resolves.toBeUndefined();

        if (expectations.manifest) {
          const manifestXml = await readFile(
            join(outDir, expectations.manifest.path),
            "utf-8",
          );
          expect(manifestXml.toLowerCase()).toContain(
            expectations.manifest.mustContain.toLowerCase(),
          );
        }
        if (expectations.forbidManifest) {
          await expect(
            access(join(outDir, "imsmanifest.xml")),
          ).rejects.toThrow();
        }

        const htmlLesson = manifest.lessons.find((l) => l.type === "markdown");
        if (htmlLesson?.type === "markdown" && htmlLesson.file) {
          await expect(
            access(join(outDir, htmlLesson.file)),
          ).resolves.toBeUndefined();
        }

        const htmlInteraction = manifest.lessons.find((l) => l.type === "html");
        if (htmlInteraction?.type === "html" && htmlInteraction.path) {
          await expect(
            access(join(outDir, htmlInteraction.path, "index.html")),
          ).resolves.toBeUndefined();
        }

        const spaLesson = manifest.lessons.find((l) => l.type === "spa");
        if (spaLesson?.type === "spa" && spaLesson.path) {
          await expect(
            access(join(outDir, spaLesson.path, "index.html")),
          ).resolves.toBeUndefined();
          expect(entryHtml).toContain("lxpack-interaction-frame");
        }

        const app = await createCompiledStaticServer(outDir);
        previewApps.push(app);

        const entryUrl = `/${expectations.entryRel}`;
        const served = await app.inject({ method: "GET", url: entryUrl });
        expect(served.statusCode, served.body).toBe(200);
        expect(served.body).toContain(manifest.title);
        expect(served.body).toContain("lxpack-app");

        const runtime = await app.inject({
          method: "GET",
          url: "/lxpack-runtime.js",
        });
        expect(runtime.statusCode).toBe(200);
        expect(runtime.body.length).toBeGreaterThan(1000);
      },
    );
  });
});
