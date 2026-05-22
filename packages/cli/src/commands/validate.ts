import { validateCourse } from "@lxpack/validators";
import pc from "picocolors";
import { findCourseDir } from "../utils.js";

export async function validateCommand(): Promise<void> {
  const courseDir = findCourseDir();
  const result = await validateCourse(courseDir);

  if (result.manifest) {
    console.log(
      pc.dim(`Course: ${result.manifest.title} v${result.manifest.version}`),
    );
    console.log(pc.dim(`Lessons: ${result.manifest.lessons.length}`));
    console.log();
  }

  for (const issue of result.issues) {
    const icon = issue.severity === "error" ? pc.red("✗") : pc.yellow("!");
    console.log(`${icon} ${issue.path}: ${issue.message}`);
  }

  if (result.valid) {
    console.log(pc.green("✓ Course validation passed"));
    process.exit(0);
  } else {
    console.log(pc.red("✗ Course validation failed"));
    process.exit(1);
  }
}
