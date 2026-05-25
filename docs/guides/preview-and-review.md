# Preview and review

**Preview** runs your course locally in a browser before you build a ZIP for the LMS.

## Start preview

From the course folder:

```bash
lxpack preview
```

Default URL: `http://127.0.0.1:3847` (change with `-p` / `-H`).

**Success looks like:** server stays running until you press `Ctrl+C`.

!!! tip "Validate first"
    Preview runs the same strict checks as build. Fix `lxpack validate` errors before preview when possible.

## What reviewers should check

| Check | How |
|-------|-----|
| Lesson order and titles | Navigate with course menu |
| Markdown rendering | Headings, lists, images |
| HTML labs | Clicks, keyboard, feedback text |
| Quizzes | Pass/fail, attempts, feedback mode |
| Branching | Two paths if using `flow` |
| Completion | Progress bar / complete state at threshold |

Share the **localhost URL** only on your network. For remote stakeholders, use a built package on a staging LMS or tunnel (organizational policy permitting).

## SCORM simulation in preview

Edit `lxpack.config.json`:

```json
{
  "preview": {
    "scormMode": "local"
  }
}
```

| Mode | Behavior |
|------|----------|
| `local` | Progress in browser `localStorage` (default) |
| `scorm12` | Simulates SCORM 1.2 API (`window.API`) |
| `scorm2004` | Simulates SCORM 2004 API (`window.API_1484_11`) |

Use `scorm12` or `scorm2004` when testing suspend/resume before LMS upload.

## xAPI preview logging

For xAPI courses, optional config:

```json
{
  "xapi": {
    "preview": {
      "logStatements": true,
      "mockLrs": true
    }
  }
}
```

Requires `tracking.xapi.activityIri` in `course.yaml`. See [Tracking and completion](../reference/tracking-and-completion.md).

## What preview blocks

Direct browser access to author-only paths is blocked (404):

- `assessments/*.yaml`
- `course.yaml`
- `lxpack.config.json`
- `.lxpack/` output

Quiz content in preview comes from the same embedded bundle as build.

## Review workflow with Claude Design

1. Author edits files  
2. `lxpack validate`  
3. `lxpack preview`  
4. Reviewer notes in a doc or ticket  
5. Claude revises Markdown/YAML/HTML  
6. Repeat until sign-off → `lxpack build`  

## Next

- [Export to LMS](export-to-lms.md)  
- [Troubleshooting](../reference/troubleshooting.md)
