# @lxpack/cli

[![npm version](https://img.shields.io/npm/v/@lxpack/cli)](https://www.npmjs.com/package/@lxpack/cli)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

Command-line tool for scaffolding, previewing, validating, and packaging LXPack courses.

Part of [LXPack](https://github.com/eddiethedean/lxpack) — an AI-native learning experience compiler and runtime (**v0.2.1**).

| Related | Package |
|---------|---------|
| Validation | [`@lxpack/validators`](../validators/README.md) |
| Browser runtime | [`@lxpack/runtime`](../runtime/README.md) |
| Export / ZIP | [`@lxpack/scorm`](../scorm/README.md) |
| Lesson widgets | [`@lxpack/components`](../components/README.md) |

## Install

```bash
npm install -g @lxpack/cli
# or: pnpm add -g @lxpack/cli
```

Requires Node.js 20+.

## Quick start

```bash
lxpack init my-course
cd my-course
lxpack preview          # http://127.0.0.1:3847 by default
lxpack validate
lxpack build --target scorm12
lxpack build --target scorm2004
```

Output lands in `.lxpack/` unless overridden by `-o` or `lxpack.config.json`.

## Commands

| Command | Description |
|---------|-------------|
| `init <name>` | Scaffold a new course (`-d, --dir <path>`, `-f, --force`) |
| `preview` | Start local preview server (`-p, --port`, `-H, --host`) |
| `validate` | Validate `course.yaml` and referenced files |
| `build` | Package for LMS or standalone export |

### `build` options

| Option | Description |
|--------|-------------|
| `-t, --target <target>` | `scorm12` (default), `scorm2004`, or `standalone` |
| `-o, --output <path>` | Output ZIP file or directory |
| `--dir` | Write an unpacked directory instead of a ZIP |

`build` and `preview` use the same validation rules: errors fail the command (exit code 1). `build` reuses the validated manifest and bakes a sanitized [assessment bundle](../validators/README.md#assessment-packaging) into the exported HTML config.

**SCORM 2004** builds produce a multi-SCO ZIP: one launch page per activity under `sco/<activityId>/index.html`, plus shared `lxpack-runtime.js` and `lxpack-components.js`.

**Preview** serves the runtime client, optional components bundle at `/runtime/components.js`, and installs SCORM API simulators (1.2 and 2004) for local testing. Direct HTTP access to `assessments/*.yaml` under `/course/` returns 404; quiz content is embedded in the preview page config only.

### Course discovery

Commands walk up from the current working directory until they find `course.yaml`. Run them from inside your course project (or a subdirectory).

### Path safety

- `init --dir` must be a relative path that stays inside the current working directory.
- `lxpack.config.json` `output.dir` is resolved relative to the course root with the same containment rules.

## Course layout

```text
my-course/
  course.yaml
  lxpack.config.json   # optional: defaultTarget, output
  lessons/
  interactions/
  assessments/         # authoring only — omitted from export ZIPs
  components/          # optional widget overrides
  assets/
  .lxpack/             # build output (generated)
```

`init` scaffolds commented examples for `variables`, `flow`, and `type: component` lessons. See [branching-demo](https://github.com/eddiethedean/lxpack/tree/main/examples/branching-demo) for a full v0.2 course.

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

See the [root README](https://github.com/eddiethedean/lxpack#course-structure) for a full `course.yaml` example.

## Programmatic use

The CLI is built with [Commander](https://github.com/tj/commander.js). For library integration, import from the built package or depend on `@lxpack/validators`, `@lxpack/scorm`, `@lxpack/runtime`, and `@lxpack/components` directly.

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/cli build
pnpm --filter @lxpack/cli test
pnpm --filter @lxpack/cli typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation index](https://github.com/eddiethedean/lxpack/blob/main/docs/README.md)
- [Roadmap & phases](https://github.com/eddiethedean/lxpack/blob/main/docs/ROADMAP.md)
- [Changelog](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md)

## License

Apache-2.0
