import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import pc from "picocolors";
import { validateCourse } from "@lxpack/validators";
import {
  findCourseDir,
  getRuntimeAssetsDir,
  loadCourseManifest,
} from "../utils.js";

const RUNTIME_STYLES = join(getRuntimeAssetsDir(), "..", "src", "styles.css");

export async function previewCommand(options: {
  port?: number;
  host?: string;
}): Promise<void> {
  const courseDir = findCourseDir();
  const port = options.port ?? 3847;
  const host = options.host ?? "127.0.0.1";

  const validation = await validateCourse(courseDir);
  if (!validation.valid) {
    console.log(pc.yellow("Warning: course has validation issues:"));
    for (const issue of validation.issues) {
      console.log(`  ${issue.path}: ${issue.message}`);
    }
    console.log();
  }

  const manifest = await loadCourseManifest(courseDir);
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

  let stylesCss = "";
  try {
    stylesCss = await readFile(RUNTIME_STYLES, "utf-8");
  } catch {
    stylesCss = "body { margin: 0; }";
  }

  app.get("/", async (_req, reply) => {
    const config = JSON.stringify({
      manifest,
      baseUrl: "/course",
      mode: "preview",
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${manifest.title} — Preview</title>
  <style>${stylesCss}</style>
</head>
<body>
  <div id="lxpack-app"></div>
  <script>
    window.__LXPACK_CONFIG__ = ${config};
  </script>
  <script type="module" src="/runtime/client.js"></script>
</body>
</html>`;

    return reply.type("text/html").send(html);
  });

  app.get("/health", async () => ({ status: "ok" }));

  await app.listen({ port, host });

  console.log(pc.green(`✓ Preview server running`));
  console.log(`  ${pc.cyan(`http://${host}:${port}`)}`);
  console.log();
  console.log(pc.dim("Press Ctrl+C to stop"));
}
