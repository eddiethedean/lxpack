/**
 * Build SCORM 12 from interchange + SPA dist only (no checked-in course.yaml required).
 * Run from examples/lessonkit-spa after: pnpm build (monorepo root)
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { packageLessonkit } from "@lxpack/api";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const spaDir = join(root, "spa", "lessons", "phishing-101");

const result = await packageLessonkit({
  interchange: {
    format: "lessonkit",
    version: "1",
    course: { title: "LessonKit SPA Demo (API)" },
    lessons: [
      {
        id: "phishing_101",
        type: "spa",
        path: "spa/lessons/phishing-101",
        title: "Phishing Awareness (SPA)",
      },
    ],
    tracking: { completion: { threshold: 0.9 } },
  },
  spaDirs: { phishing_101: spaDir },
  target: "scorm12",
  outputBaseDir: ".lxpack",
});

if (!result.ok) {
  console.error("packageLessonkit failed:", result.issues);
  process.exit(1);
}

console.log("Built:", result.outputPath ?? result.outputDir);
console.log("Staging courseDir:", result.courseDir);
