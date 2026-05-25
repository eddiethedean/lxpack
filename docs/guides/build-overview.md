# Build courses

Guides for structuring and authoring LXPack content after you have the [CLI installed](../getting-started/install-cli.md).

## Authoring pipeline

Every module follows the same loop:

1. Edit `course.yaml`, `lessons/`, `assessments/`, and optional `interactions/`
2. `lxpack validate`
3. `lxpack preview` for review
4. `lxpack build --target …` when ready for the LMS

--8<-- "commands/core-workflow.md"

## Guides

<div class="grid cards" markdown>

-   :octicons-file-directory-24: **[Course structure](course-structure.md)**

    ---

    What each folder is for after `lxpack init`.

-   :octicons-markdown-24: **[Writing lessons](writing-lessons.md)**

    ---

    Markdown pages and built-in components (no HTML required).

-   :octicons-browser-24: **[Building interactions](building-interactions.md)**

    ---

    Clickable HTML labs with `lxpack.track`.

-   :octicons-question-24: **[Quizzes & assessments](quizzes-and-assessments.md)**

    ---

    YAML MCQs and what ships in the export ZIP.

-   :octicons-git-branch-24: **[Branching & paths](branching-and-paths.md)**

    ---

    Variables and `flow` for non-linear courses.

-   :octicons-eye-24: **[Preview & review](preview-and-review.md)**

    ---

    Stakeholder review and SCORM simulators in preview.

-   :octicons-cloud-upload-24: **[Export to LMS](export-to-lms.md)**

    ---

    SCORM 1.2 / 2004, xAPI, cmi5, or standalone.

</div>

## AI help while you author

| Resource | Use when |
|----------|----------|
| [Prompts for Claude & Cursor](prompts-for-claude.md) | One-off chat tasks with copy buttons |
| [Library Skills](library-skills.md) | Installable agent expertise in Cursor / Claude Code |
| [Workflow overview](workflow-overview.md) | Choosing a full authoring track |
