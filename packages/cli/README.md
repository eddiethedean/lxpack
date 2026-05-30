# @lxpack/cli

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/cli)](https://www.npmjs.com/package/@lxpack/cli)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

Command-line tool for scaffolding, previewing, validating, and packaging LXPack courses.

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/) · [File-based authoring](https://lxpack.readthedocs.io/en/latest/guides/file-based/).

| Related | Package |
|---------|---------|
| Programmatic API | [`@lxpack/api`](https://github.com/eddiethedean/lxpack/blob/main/packages/api/README.md) |
| Validation | [`@lxpack/validators`](https://github.com/eddiethedean/lxpack/blob/main/packages/validators/README.md) |
| Browser runtime | [`@lxpack/runtime`](https://github.com/eddiethedean/lxpack/blob/main/packages/runtime/README.md) |
| Export / ZIP | [`@lxpack/scorm`](https://github.com/eddiethedean/lxpack/blob/main/packages/scorm/README.md) |
| Lesson widgets | [`@lxpack/components`](https://github.com/eddiethedean/lxpack/blob/main/packages/components/README.md) |

## Install

See [Install the CLI](https://lxpack.readthedocs.io/en/latest/getting-started/install-cli/).

```bash
npm install -g @lxpack/cli
# or: pnpm add -g @lxpack/cli
```

Requires Node.js 18 or 20 (18+).

## Quick start

Tutorial: [Your first course](https://lxpack.readthedocs.io/en/latest/getting-started/your-first-course/).

```bash
lxpack init my-course
cd my-course
lxpack preview          # http://127.0.0.1:3847 by default
lxpack validate
lxpack build --target scorm12
lxpack build --target scorm2004
lxpack build --target xapi
lxpack build --target cmi5
```

Output lands in `.lxpack/` unless overridden by `-o` or `lxpack.config.json`.

## Commands

Authoritative option list: [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/). Export targets: [Export to LMS](https://lxpack.readthedocs.io/en/latest/guides/export-to-lms/).

| Command | Description |
|---------|-------------|
| `init <name>` | Scaffold a new course (`-d, --dir <path>`, `-f, --force`) |
| `preview` | Start local preview server (`-p, --port`, `-H, --host`) |
| `validate` | Validate `course.yaml` and referenced files (`-t, --target` for export checks) |
| `build` | Package for LMS or standalone export |

### `build` options

| Option | Description |
|--------|-------------|
| `-t, --target <target>` | `scorm12` (default), `scorm2004`, `standalone`, `xapi`, or `cmi5` |
| `-o, --output <path>` | Output ZIP file or directory |
| `--dir` | Write an unpacked directory instead of a ZIP |

`build` and `preview` use the same validation rules: errors fail the command (exit code 1). `build` reuses the validated manifest and bakes a sanitized [assessment bundle](https://github.com/eddiethedean/lxpack/blob/main/packages/validators/README.md#assessment-packaging) into the exported HTML config.

**SCORM 2004** builds produce a multi-SCO ZIP: one launch page per activity under `sco/<activityId>/index.html`, plus shared `lxpack-runtime.js` and `lxpack-components.js`.

**Preview** serves the runtime client and optional components bundle at `/runtime/components.js`. Configure SCORM simulators in `lxpack.config.json`:

```json
{ "preview": { "scormMode": "local" } }
```

| `scormMode` | Behavior |
|-------------|----------|
| `local` | `localStorage` progress (default) |
| `scorm12` | SCORM 1.2 simulator on `window.API` |
| `scorm2004` | SCORM 2004 simulator on `window.API_1484_11` |

Direct HTTP access to `assessments/`, `course.yaml`, `lxpack.config.json`, and `.lxpack/` under `/course/` returns 404; quiz content is embedded in the preview page config only.

### Course discovery

Commands walk up from the current working directory until they find `course.yaml`. Run them from inside your course project (or a subdirectory).

### Path safety

- `init --dir` must be a relative path that stays inside the current working directory.
- `lxpack.config.json` `output.dir` is resolved relative to the course root with the same containment rules.

## Course layout

[Course structure](https://lxpack.readthedocs.io/en/latest/guides/course-structure/) · [course.yaml](https://lxpack.readthedocs.io/en/latest/reference/course-yaml/) · [lxpack.config.json](https://lxpack.readthedocs.io/en/latest/reference/lxpack-config/).

```text
my-course/
  course.yaml
  lxpack.config.json   # optional: defaultTarget, output
  lessons/
  interactions/
  assessments/         # authoring only — omitted from export ZIPs
  components/          # optional widget overrides
  assets/
  .gitignore           # .lxpack/, *.zip (assessments/ stay tracked)
  .lxpack/             # build output (generated)
```

`init` scaffolds commented examples for `variables`, `flow`, and `type: component` lessons. See [branching-demo](https://github.com/eddiethedean/lxpack/tree/main/examples/branching-demo) for variables, flow, and components.

### `lxpack.config.json`

```json
{
  "defaultTarget": "scorm12",
  "output": {
    "dir": ".lxpack"
  }
}
```

Use `"defaultTarget": "scorm2004"` when your LMS expects SCORM 2004 4th Edition packages.

See [course.yaml reference](https://lxpack.readthedocs.io/en/latest/reference/course-yaml/) and [branching](https://lxpack.readthedocs.io/en/latest/guides/branching-and-paths/) for full examples.

## Programmatic use

The CLI is built with [Commander](https://github.com/tj/commander.js). `validate` and `build` delegate to [`@lxpack/api`](https://github.com/eddiethedean/lxpack/blob/main/packages/api/README.md), which returns structured results instead of exiting the process.

```ts
import { validateCourse, buildCourse } from "@lxpack/api";

const result = await validateCourse({ courseDir: "/path/to/course", target: "scorm12" });
if (!result.ok) {
  for (const issue of result.issues) console.error(issue.path, issue.message);
}

await buildCourse({ courseDir: "/path/to/course", target: "scorm12" });
```

For lower-level control, depend on `@lxpack/validators`, `@lxpack/scorm`, `@lxpack/runtime`, and `@lxpack/components` directly. LessonKit workflows: [LessonKit & React hub](https://lxpack.readthedocs.io/en/latest/guides/lessonkit/).

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/cli build
pnpm --filter @lxpack/cli test
pnpm --filter @lxpack/cli typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation](https://lxpack.readthedocs.io/en/latest/)
- [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/)
- [Roadmap & phases](https://lxpack.readthedocs.io/en/latest/developer/ROADMAP/)
- [Changelog](https://lxpack.readthedocs.io/en/latest/project/changelog/)

## License

Apache-2.0
