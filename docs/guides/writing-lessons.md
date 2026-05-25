# Writing lessons

--8<-- "copy-tip.md"

Most content is **Markdown** in `lessons/`. You do not need HTML for text-heavy modules.

## Markdown lessons

### 1. Create the file

`lessons/security-intro.md`:

```markdown
# Security introduction

Welcome to the program.

## Key policies

- Report suspicious email to the help desk.
- Never share passwords in chat.

## Next step

Complete the phishing lab, then take the quiz.
```

### 2. Register in `course.yaml`

```yaml
lessons:
  - id: security_intro
    title: Security introduction
    type: markdown
    file: lessons/security-intro.md
```

The `id` must be unique. Use `file:` path relative to the course root.

### 3. Validate

```bash title="lxpack validate"
lxpack validate
```

## Formatting tips

| Markdown | Use for |
|----------|---------|
| `#` / `##` | Section headings |
| `-` or `1.` | Lists |
| `**bold**` | Emphasis |
| `[link text](https://…)` | External links |
| `![alt](assets/diagram.png)` | Images in `assets/` |

LXPack sanitizes Markdown in the browser for safety. Use trusted author content only.

## Component lessons (no HTML)

Built-in widgets for callouts, checklists, and image cards:

```yaml
  - id: reminder
    title: Remember
    type: component
    component: callout
    props:
      variant: warning
      body: Complete the lab before the quiz.
```

See [Components](../reference/components.md).

## When to use HTML instead

Choose `type: html` when learners must **click, drag, or simulate** something. See [Building interactions](building-interactions.md).

## Authoring with Claude

Paste objectives + audience into Claude; ask for Markdown only. Then add the lesson block to `course.yaml` using [Prompts for Claude](prompts-for-claude.md).

## Lesson order

Order in `course.yaml` under `lessons:` is the **default linear path**. Branching overrides order via `flow` — [Branching and paths](branching-and-paths.md).

## Next

- [Building interactions](building-interactions.md)  
- [Quizzes and assessments](quizzes-and-assessments.md)
