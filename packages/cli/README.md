# @lxpack/cli

[![npm version](https://img.shields.io/npm/v/@lxpack/cli)](https://www.npmjs.com/package/@lxpack/cli)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/@lxpack/cli)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

Command-line tool for scaffolding, previewing, validating, and packaging LXPack courses.

Part of [LXPack](https://github.com/eddiethedean/lxpack) — an AI-native learning experience compiler and runtime.

## Install

```bash
npm install -g @lxpack/cli
```

Requires Node.js 20+.

## Usage

```bash
lxpack init my-course
cd my-course
lxpack preview
lxpack validate
lxpack build --target scorm12
```

### Commands

| Command | Description |
|---------|-------------|
| `init <name>` | Scaffold a new course (`-d, --dir`, `-f, --force`) |
| `preview` | Start local preview server (`-p, --port`, `-H, --host`) |
| `validate` | Validate `course.yaml` and referenced files |
| `build` | Package for LMS or standalone export |

### `build` options

| Option | Description |
|--------|-------------|
| `-t, --target <target>` | `scorm12` (default) or `standalone` |
| `-o, --output <path>` | Output ZIP file or directory |
| `--dir` | Write an unpacked directory instead of a ZIP |

Commands walk up from the current directory until they find `course.yaml`.

## Course layout

```text
my-course/
  course.yaml
  lxpack.config.json   # optional
  lessons/
  interactions/
  assessments/
  assets/
  .lxpack/               # build output
```

See the [root README](https://github.com/eddiethedean/lxpack#course-structure) for manifest examples.

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/cli build
pnpm --filter @lxpack/cli test
```

## License

Apache-2.0
