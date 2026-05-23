import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pc from "picocolors";

const COURSE_YAML = `title: {{title}}
version: 1.0.0
description: An LXPack learning experience

runtime:
  theme: modern

tracking:
  completion:
    threshold: 0.9

lessons:
  - id: welcome
    title: Welcome
    type: markdown
    file: lessons/welcome.md

  - id: phishing-lab
    title: Phishing Lab
    type: html
    path: interactions/phishing-lab

assessments:
  - id: final_quiz
    file: assessments/final.yaml
`;

const WELCOME_MD = `# Welcome

Welcome to your LXPack course.

## What you'll learn

- How to structure AI-native learning experiences
- How to build HTML interactions
- How to export SCORM packages for your LMS

## Getting started

Use the navigation to move between lessons. Mark each lesson complete when finished.
`;

const PHISHING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phishing Lab</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    .email { border: 1px solid #ccc; padding: 1rem; border-radius: 8px; cursor: pointer; }
    .email:hover { background: #f0f4ff; }
    .result { margin-top: 1rem; padding: 1rem; border-radius: 8px; display: none; }
    .result.show { display: block; }
    .safe { background: #dcfce7; color: #166534; }
    .danger { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <h1>Phishing Detection Lab</h1>
  <p>Click the suspicious email below to report it.</p>
  <div class="email" id="phishing-email" role="button" tabindex="0" aria-label="Suspicious email from unknown sender">
    <strong>From:</strong> security@paypa1-verify.com<br>
    <strong>Subject:</strong> URGENT: Your account will be suspended<br>
    <p>Click here immediately to verify your identity...</p>
  </div>
  <div class="result" id="result"></div>
  <script>
    const email = document.getElementById('phishing-email');
    const result = document.getElementById('result');
    email.addEventListener('click', () => {
      result.className = 'result show danger';
      result.textContent = 'Correct! This is a phishing attempt. Look for misspelled domains and urgency tactics.';
      if (window.parent.lxpack) {
        window.parent.lxpack.track({ type: 'interaction', id: 'phishing_detected' });
      }
    });
    email.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); email.click(); }
    });
  </script>
</body>
</html>
`;

const FINAL_ASSESSMENT = `id: final_quiz
title: Final Quiz
passingScore: 0.7
questions:
  - id: q1
    prompt: What is a common sign of a phishing email?
    choices:
      - id: a
        text: Urgent language demanding immediate action
        correct: true
      - id: b
        text: A message from your company's IT department with your name
      - id: c
        text: A calendar invitation for a team meeting
  - id: q2
    prompt: What should you do if you suspect a phishing email?
    choices:
      - id: a
        text: Click the link to verify it is safe
      - id: b
        text: Report it to your security team
        correct: true
      - id: c
        text: Forward it to all colleagues as a warning
`;

const LXPACK_CONFIG = `/** @type {import('@lxpack/cli').LxpackConfig} */
export default {
  runtime: {
    theme: "modern",
  },
  exports: {
    scorm12: true,
    standalone: true,
  },
};
`;

export async function initCommand(
  projectName: string,
  options: { dir?: string } = {},
): Promise<void> {
  const targetDir = options.dir ?? projectName;
  const title = projectName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const dirs = [
    targetDir,
    join(targetDir, "lessons"),
    join(targetDir, "interactions", "phishing-lab"),
    join(targetDir, "assets"),
    join(targetDir, "assessments"),
    join(targetDir, "theme"),
  ];

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(
    join(targetDir, "course.yaml"),
    COURSE_YAML.replace("{{title}}", title),
  );
  await writeFile(join(targetDir, "lessons", "welcome.md"), WELCOME_MD);
  await writeFile(
    join(targetDir, "interactions", "phishing-lab", "index.html"),
    PHISHING_HTML,
  );
  await writeFile(join(targetDir, "assessments", "final.yaml"), FINAL_ASSESSMENT);
  await writeFile(join(targetDir, "lxpack.config.ts"), LXPACK_CONFIG);
  await writeFile(join(targetDir, "theme", ".gitkeep"), "");

  console.log(pc.green(`✓ Created LXPack course: ${targetDir}`));
  console.log();
  console.log("Next steps:");
  console.log(`  cd ${targetDir}`);
  console.log("  lxpack preview");
  console.log("  lxpack validate");
  console.log("  lxpack build --target scorm12");
}
