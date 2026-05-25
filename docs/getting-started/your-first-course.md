# Your first course

This walkthrough uses the project created by `lxpack init`. You will preview in the browser, check for errors, and build a SCORM package for your LMS.

## 1. Create the project

Open Terminal in the folder where you keep courses (for example `Documents/Courses`):

```bash
lxpack init my-first-course
cd my-first-course
```

**Success looks like:** green checkmark message and a list of “Next steps.”

## 2. See what was created

Your folder now contains:

| Path | What it is |
|------|------------|
| `course.yaml` | Course settings and lesson list |
| `lessons/welcome.md` | First lesson (Markdown) |
| `interactions/phishing-lab/index.html` | Clickable lab activity |
| `assessments/final.yaml` | Final quiz (authoring file) |
| `lxpack.config.json` | Default export target and preview options |

More detail: [Course structure](../guides/course-structure.md).

## 3. Preview in the browser

```bash
lxpack preview
```

**Success looks like:** a line like `Preview server running at http://127.0.0.1:3847`

1. Copy that URL into Chrome, Edge, or Safari.
2. Click through the welcome lesson and phishing lab.
3. Try the final quiz.

Leave preview running while you edit files. Stop it with `Ctrl+C` in Terminal when done.

## 4. Validate (spell-check for your course)

In a **new** Terminal window (or after stopping preview), from the same course folder:

```bash
lxpack validate
```

**Success looks like:** no output and exit code 0, or an explicit success message.

If something is wrong, LXPack prints plain-language errors. Paste them into Claude or see [Troubleshooting](../reference/troubleshooting.md).

## 5. Build a SCORM 1.2 package

Most corporate LMS platforms accept SCORM 1.2:

```bash
lxpack build --target scorm12
```

**Success looks like:** a ZIP under `.lxpack/`, for example `.lxpack/my-first-course-scorm12.zip`.

Upload that ZIP to your LMS as a new SCORM package. Exact steps depend on Moodle, Cornerstone, SuccessFactors, etc. See [Export to your LMS](../guides/export-to-lms.md).

## 6. Change one lesson (with Claude)

1. Open `lessons/welcome.md` in your editor.
2. In Claude, say: “Rewrite this welcome lesson for new hires in healthcare. Keep Markdown headings.”
3. Paste your current `welcome.md` content.
4. Save Claude’s reply over `welcome.md`.
5. Run `lxpack validate`, then `lxpack preview` again.

## What you learned

| Step | Command | Purpose |
|------|---------|---------|
| Create | `lxpack init` | Starter files |
| Preview | `lxpack preview` | Click-through review |
| Validate | `lxpack validate` | Catch broken structure before build |
| Build | `lxpack build --target scorm12` | LMS-ready ZIP |

## Go further

- [Glossary](glossary.md) — terms in plain language
- [Workflow with Claude Design](../guides/workflow-claude-design.md) — full authoring process
- [Migrating from legacy tools](../guides/migrating-from-legacy-tools.md) — Storyline / Rise mapping
