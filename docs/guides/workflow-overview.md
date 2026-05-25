# Workflow overview

One pipeline, three authoring tracks. Everyone ends with the same commands: **validate → preview → build**.

## Pick your track

```mermaid
flowchart TD
  start[New to LXPack]
  q1{Comfortable in an IDE?}
  q2{Using Claude in the editor?}
  design[Claude Design]
  cursorOnly[Cursor only]
  claudeCode[Claude Code]
  start --> q1
  q1 -->|No| design
  q1 -->|Yes| q2
  q2 -->|No| cursorOnly
  q2 -->|Yes| claudeCode
  design --> pipe[validate → preview → build]
  cursorOnly --> pipe
  claudeCode --> pipe
```

<div class="grid cards" markdown>

-   :octicons-pencil-24: **[Claude Design](workflow-claude-design.md)**

    ---

    Instructional designers: Claude for drafts, any editor + Terminal for `lxpack`.

-   :octicons-tools-24: **[Cursor without Claude](workflow-cursor.md)**

    ---

    IDE file tree and integrated terminal; you write the content.

-   :octicons-code-24: **[Claude Code](workflow-claude-code.md)**

    ---

    Cursor + Claude Agent, optional Git, monorepo-friendly.

</div>

## Shared pipeline

| # | Step | Command / action |
|---|------|------------------|
| 1 | Plan | Objectives, storyboard, LMS target |
| 2 | Edit | `course.yaml`, `lessons/`, `assessments/`, `interactions/` |
| 3 | Validate | `lxpack validate` |
| 4 | Review | `lxpack preview` |
| 5 | Export | `lxpack build --target …` |
| 6 | Deploy | LMS admin imports `.lxpack/*.zip` |

--8<-- "commands/core-workflow.md"

## From Storyline, Rise, or Captivate?

Start with [Migrating from legacy tools](migrating-from-legacy-tools.md) — you keep instructional design skills; the file model changes from slides to **folders + web pages**.

## Related guides

See [Build courses](build-overview.md) for lesson, quiz, and export depth. For AI:

- [Prompts for Claude & Cursor](prompts-for-claude.md)
- [Library Skills](library-skills.md)

!!! info "v0.3.1 scope"
    No `lxpack repair` or bundled AI CLI yet — Claude edits files; `lxpack` validates and packages. Phase 4 may add more automation.
