Plain-language fixes for common `lxpack validate` and `lxpack build` messages.

## Before you ask for help

1. Run commands from the **course folder** (where `course.yaml` lives).
2. Copy the **full** Terminal error text.
3. Run `lxpack validate` before `preview` or `build`.
4. Paste errors into Claude using [Prompts for Claude](../guides/prompts-for-claude.md).

## Command not found

| Problem | Fix |
|---------|-----|
| `lxpack: command not found` | Install CLI: [Install the CLI](../getting-started/install-cli.md) |
| `node: command not found` | Install Node.js 18 or 20 |

## Path and file errors

| Message (typical) | Meaning | Fix |
|-------------------|---------|-----|
| File not found | `file:` or `path:` points to missing file | Create the file or fix the path in `course.yaml` |
| Path escapes course root | `../` or symlink outside project | Keep all files inside the course folder |
| Duplicate lesson id | Two lessons share `id` | Rename one `id` and update `flow` `goto` targets |

## YAML and schema errors

| Message (typical) | Meaning | Fix |
|-------------------|---------|-----|
| Invalid course.yaml | Typo, tabs, or wrong field names | Use spaces not tabs; compare to [course.yaml](course-yaml.md) example |
| Unknown lesson type | `type:` not markdown/html/component | Fix `type` spelling |
| Assessment validation failed | Quiz YAML structure | One `correct: true` per question; unique `id`s |

## LessonKit interchange

| Problem | Fix |
|---------|-----|
| React course packaging | Use [LessonKit 1.0](https://github.com/eddiethedean/lessonkit): `lessonkit package --target scorm12` (requires `@lxpack/api` **0.6.2+**, Node **18+**) |
| `lxpack build --lessonkit` ignores project `lxpack.config.json` | Keep `lxpack.config.json` in the **same folder as `lessonkit.json`** (v0.6.1+), or pass `configDir` to `packageLessonkit()` |
| `lessonkit.json` appears inside LMS ZIP | Upgrade to v0.6.1+; interchange files are author metadata and are excluded from exports |

## Export-specific errors

| Message (typical) | Meaning | Fix |
|-------------------|---------|-----|
| xAPI activity IRI required | Building xapi/cmi5 without tracking | Add `tracking.xapi.activityIri` (HTTPS URL) |
| Invalid activity IRI | Not HTTPS or malformed URL | Use `https://your-domain/...` stable path |
| Unknown export target | Typo in `--target` | Use `scorm12`, `scorm2004`, `standalone`, `xapi`, `cmi5` |
| Validate passes, xapi/cmi5 build fails | Older CLI defaulted validate differently than build | Use current CLI: both default to `scorm12`, or pass `-t xapi` / set `exports.defaultTarget` |

## Quiz integrity (client-side scoring)

SCORM 1.2, standalone, xAPI, and cmi5 ship **one** `index.html` with all quiz answer keys in embedded JSON (learners can view source). SCORM 2004 embeds keys only on assessment SCO pages. Use server-side grading or per-lesson packaging if you need stronger integrity.

## Preview issues

| Problem | Fix |
|---------|-----|
| Preview won't start | Fix `lxpack validate` errors first |
| Blank page | Check Terminal for port conflict; try `-p 3850` |
| Quiz doesn't load | Validation error in assessment YAML |
| Branching wrong | Check `flow` `goto` matches lesson `id`; test `interaction.done` on `html` or `spa` lessons |
| Preview on LAN | Non-loopback `--host` exposes embedded answer keys | Use `127.0.0.1` or heed the CLI warning |
| cmi5 `fetch` in LMS | Missing `endpoint` on launch URL, or fetch URL reused | Launch must include `endpoint`; fetch is one-time — refresh uses cached token in `sessionStorage` |

## LMS issues after upload

| Problem | Fix |
|---------|-----|
| Package rejected | Confirm SCORM version with LMS admin; try `scorm12` |
| Stuck incomplete | Lower `tracking.completion.threshold` or complete all required lessons |
| Quiz score wrong | Check `passingScore` and question `correct` flags |
| Resume lost | Test SCORM mode in preview; confirm LMS suspend support |

## Still stuck?

- Compare your project to `examples/security-awareness` in the repository
- Developer details: [SPEC](../developer/SPEC.md)
- GitHub issues: [eddiethedean/lxpack](https://github.com/eddiethedean/lxpack/issues)

## Related

- [CLI reference](cli.md)
- [Glossary](../getting-started/glossary.md)
