# Workflow with Claude Design

--8<-- "copy-tip.md"

This is the **recommended path for instructional designers** who do not write application code. You use **Claude Design** (or Claude chat) to draft content, a **simple text editor** to save files, and **Terminal only for `lxpack` commands**.

## Mindset: slides become files

| Old habit (Storyline / Rise) | LXPack habit |
|------------------------------|--------------|
| One `.story` or Rise project | A **folder** of text files |
| Slide = screen | **Lesson** = markdown page, component, or HTML lab |
| Trigger / variable | `variables` and `flow` in `course.yaml` |
| Quiz slide | `assessments/final.yaml` |
| Publish | `lxpack build` → upload ZIP |

You are building a **small website** the LMS wraps — not exporting PowerPoint.

## What you need

Complete [What you need](../getting-started/what-you-need.md) and [Your first course](../getting-started/your-first-course.md) once before this workflow.

## Phase 1 — Set up the project

```bash title="lxpack init compliance-2026"
lxpack init compliance-2026
cd compliance-2026
lxpack preview
```

Tour the sample course in the browser. Stop preview with `Ctrl+C` when ready.

## Phase 2 — Plan in Claude Design

In Claude Design (or a Claude project), capture:

1. **Audience** and prerequisites  
2. **Learning objectives** (measurable)  
3. **Module outline** — each module = one or more lessons  
4. **Activities** — what must be *done*, not only read (click, choose path, pass quiz)  
5. **Assessment plan** — formative vs summative, pass score  
6. **LMS requirement** — SCORM 1.2 vs 2004 vs xAPI (see [Export to LMS](export-to-lms.md))

Export or copy briefs you will turn into `lessons/*.md` and quiz YAML.

!!! tip "One module at a time"
    Finish validate → preview for module 1 before drafting module 5. Small loops reduce rework.

## Phase 3 — Authoring loop (repeat per module)

### Step A — Draft lesson Markdown

Paste into Claude:

- Learning objectives for this lesson  
- Tone and length (for example “5 minutes, conversational, healthcare”)  
- Any source PDF or policy text  

Ask for **Markdown only** with `#` / `##` headings. Save as `lessons/<id>.md`.

### Step B — Register the lesson in `course.yaml`

`course.yaml` is your **table of contents**. Each lesson needs:

```yaml
  - id: policy_basics
    title: Policy basics
    type: markdown
    file: lessons/policy_basics.md
```

Use a prompt from [Prompts for Claude & Cursor](prompts-for-claude.md) (for example “Add markdown lesson to course.yaml”). Always keep `id` values **lowercase, no spaces** (use underscores).

### Step C — Quizzes (if this module has one)

Ask Claude to produce assessment YAML matching [Quizzes and assessments](quizzes-and-assessments.md). Save under `assessments/` and add to `course.yaml`:

```yaml
assessments:
  - id: module1_quiz
    file: assessments/module1_quiz.yaml
```

### Step D — Interactive lab (optional)

For click scenarios, ask Claude for HTML using the template in [Building interactions](building-interactions.md). Save as `interactions/<name>/index.html` and add a `type: html` lesson.

### Step E — Validate

```bash title="lxpack validate"
lxpack validate
```

If errors appear, copy the **full Terminal output** into Claude: “Fix these LXPack validation errors” and paste your `course.yaml` plus the error text. See [Troubleshooting](../reference/troubleshooting.md).

### Step F — Preview for review

```bash title="lxpack preview"
lxpack preview
```

Share the local URL with reviewers. Collect edits in Markdown/YAML, not screenshots of slides.

## Phase 4 — Branching (optional)

If learners take different paths (role-based content, remedial track), add `variables` and `flow`. Start from the repository example `branching-demo` and read [Branching and paths](branching-and-paths.md).

Validate extra carefully — branching errors are common when `goto` targets a lesson `id` that does not exist.

## Phase 5 — Export and hand off to LMS

```bash title="lxpack validate --target scorm12"
lxpack validate --target scorm12
lxpack build --target scorm12
```

Give `.lxpack/<course>-scorm12.zip` to your LMS administrator with:

- Intended audience  
- Completion rule (from `tracking.completion.threshold` in `course.yaml`)  
- Whether quiz scores must pass (from `passingScore` in assessment YAML)

## Phase 6 — Migration from an existing course

Use the checklist in [Migrating from legacy tools](migrating-from-legacy-tools.md):

1. Inventory legacy slides → map to lessons  
2. Rebuild interactions as HTML (or components)  
3. Recreate quizzes in YAML  
4. Pilot **one module** end-to-end  
5. Full build and LMS test in **staging**

## FAQ

### Do I need Git?

No. Git helps teams track changes but is not required. Developers often use Git; see [Claude Code workflow](workflow-claude-code.md).

### Where do quiz answers live?

In `assessments/*.yaml` on your machine for editing. The **built ZIP** embeds quiz data for the runtime — learners do not download your YAML files. See [Quizzes and assessments](quizzes-and-assessments.md).

### Why did validate fail?

Usually: typo in `file:` path, duplicate lesson `id`, or missing `tracking.xapi` for xAPI/cmi5 builds. [Troubleshooting](../reference/troubleshooting.md) decodes common messages.

### Can Claude edit `course.yaml` for me?

Yes. Paste the whole file and ask for a diff-style reply. Review `id` values and indentation (YAML uses spaces, not tabs).

## Related

- [Cursor without Claude](workflow-cursor.md) — if you prefer an IDE but write content yourself  
- [Prompts for Claude & Cursor](prompts-for-claude.md) — copy buttons on each block  
- [Preview and review](preview-and-review.md)  
- [Export to LMS](export-to-lms.md)
