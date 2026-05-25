# Workflow with Claude Code

--8<-- "copy-tip.md"

This track is for **developers and power users** who work in **Cursor** (or VS Code) with **Claude Code** (or Cursor Agent with Claude), use **Git** optionally, and may contribute to LXPack itself.

!!! note "Using Cursor without AI?"
    If you want Cursor only as an editor — no Claude — follow [Workflow with Cursor (without Claude)](workflow-cursor.md) instead.

The validate → preview → build loop is identical to the [Claude Design workflow](workflow-claude-design.md); differences are **tooling**, **AI-assisted edits**, and **repository hygiene**.

## Prerequisites

- Node.js 20+, `@lxpack/cli` installed globally (or via `pnpm exec` from the LXPack monorepo)
- Cursor with Claude Code enabled
- Comfort with Terminal, YAML, and HTML

## Install Library Skills (recommended)

From the LXPack repo (or your fork), install agent skills once:

```bash title="./library-skills/install.sh --global"
./library-skills/install.sh --global
```

Or per course project:

```bash title="./library-skills/install.sh --project --directory ./..."
./library-skills/install.sh --project --directory ./product-training
```

Skills include **lxpack-author**, **lxpack-interaction**, **lxpack-export**, and **lxpack-migrate-legacy**. They load on demand so Claude does not need a megaprompt every session. Details: [Library Skills](library-skills.md).

## Open your course in Cursor

```bash title="lxpack init product-training"
lxpack init product-training
cd product-training
cursor .
```

Open the whole course folder — not individual files in isolation — so Claude sees `course.yaml`, `lessons/`, and `assessments/` together.

### Recommended workspace layout

```text title="product-training/"
product-training/
  course.yaml
  lxpack.config.json
  lessons/
  interactions/
  assessments/
  assets/
  components/   # optional overrides
  .lxpack/      # gitignore this
```

Add `.lxpack/` to `.gitignore` if you use Git.

## Daily loop with Claude Code

1. **Describe the change** in Cursor chat (“Add lesson `glossary` after welcome, link in course.yaml”).
2. Let Claude edit multiple files; review the diff.
3. Run in the integrated terminal:

```bash title="lxpack validate"
   lxpack validate
   lxpack preview
   ```

4. For export-specific rules:

```bash title="lxpack validate --target scorm2004"
   lxpack validate --target scorm2004
   lxpack build --target scorm2004
   ```

5. Commit when satisfied:

```bash title="git add course.yaml lessons/ assessments/"
   git add course.yaml lessons/ assessments/
   git commit -m "Add glossary lesson"
   ```

## Working inside the LXPack monorepo

When developing LXPack from source:

```bash title="git clone https://github.com/eddiethedean/lxpack.git"
git clone https://github.com/eddiethedean/lxpack.git
cd lxpack
corepack enable
pnpm install
pnpm build

cd examples/security-awareness
pnpm exec lxpack preview
pnpm exec lxpack validate
pnpm exec lxpack build --target scorm12
```

Use `pnpm exec lxpack` so you run the workspace CLI, not only the global install.

Validate all examples:

```bash title="pnpm examples:validate"
pnpm examples:validate
```

## When to read developer docs vs user reference

| Question | Read |
|----------|------|
| How do I author a course? | [User guides](workflow-overview.md) and [Reference](../reference/course-yaml.md) |
| How does validation work internally? | [SPEC](../developer/SPEC.md) |
| Package boundaries, analytics | [ARCHITECTURE](../developer/ARCHITECTURE.md) |
| Roadmap / phases | [ROADMAP](../developer/ROADMAP.md) |

## Claude Code tips

- Reference **example courses** in prompts: “Match the flow pattern in `examples/branching-demo/course.yaml`.”
- Ask Claude to run `lxpack validate` and paste stderr on failure.
- For HTML interactions, require the `window.parent.lxpack.track` hook from [Building interactions](building-interactions.md).
- Do not invent v0.4 CLI commands (`repair`, etc.) — not in v0.3.3.

## Git workflow for teams

| Practice | Why |
|----------|-----|
| One repo per course (or monorepo with `courses/*`) | Clear ownership |
| PR review on `course.yaml` + content | Catch broken `id`s before build |
| CI running `lxpack validate` | Same checks locally — add to your pipeline if needed |
| Never commit `.lxpack/` output | Reproducible builds |

## Security reminders for implementers

- Author `assessments/*.yaml` stays in Git; exports embed learner-safe bundles.
- Do not fetch assessment YAML in custom HTML — use embedded config only.
- Path traversal: keep all assets inside the course directory.

See [SPEC — security](../developer/SPEC.md) for full requirements.

## Related

- [Cursor without Claude](workflow-cursor.md) — same IDE, no AI authoring  
- [Claude Design workflow](workflow-claude-design.md) — share with non-coder teammates  
- [Prompts for Claude & Cursor](prompts-for-claude.md)  
- [Developer index](../developer/index.md)
