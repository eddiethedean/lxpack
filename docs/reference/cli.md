# CLI reference

--8<-- "copy-tip.md"

**v0.6.0** · Requires Node.js 20+ and `@lxpack/cli` on your PATH.

## Copy-paste commands

--8<-- "commands/install.md"

--8<-- "commands/new-course.md"

--8<-- "commands/core-workflow.md"

Commands discover the course by walking up from the current directory until they find `course.yaml`.

## Commands

| Command | Description |
|---------|-------------|
| `lxpack init <name>` | Create a new course (`-d, --dir`, `-f, --force`) |
| `lxpack preview` | Local preview server (`-p, --port`, `-H, --host`, `-t, --target`, `--lessonkit`) |
| `lxpack validate` | Validate structure (`-t, --target`, `--lessonkit` for interchange) |
| `lxpack build` | Package for LMS (`-t, --target`, `-o, --output`, `--dir`, `--lessonkit`) |

## `init`

```bash title="lxpack init my-course"
lxpack init my-course
lxpack init my-course --dir ./courses/my-course
lxpack init my-course --force
```

`--dir` must stay inside the current working directory.

## `preview`

```bash title="lxpack preview"
lxpack preview
lxpack preview -p 4000 -H 0.0.0.0
lxpack preview --target xapi
```

Default: `http://127.0.0.1:3847`

Uses the same `defaultTarget` resolution as `build` when `--target` is omitted. Warns when `--host` is not loopback (embedded assessment keys). Fails if validation fails (same as build).

LessonKit interchange preview (same flags as `build --lessonkit`):

```bash title="lxpack preview --lessonkit"
lxpack preview --lessonkit ./lessonkit.json \
  --spa-lesson spa1=/abs/path/to/dist
```

## `validate`

```bash title="lxpack validate"
lxpack validate
lxpack validate --target scorm12
lxpack validate --target xapi
lxpack validate --lessonkit ./lessonkit.json --spa-lesson spa1=/abs/path/to/dist
```

LessonKit interchange validation (same SPA flags as `build --lessonkit`):

```bash title="lxpack validate --lessonkit"
lxpack validate --lessonkit ./lessonkit.json \
  --spa-lesson spa1=/abs/path/to/dist
```

| Target | Extra checks |
|--------|----------------|
| `scorm12` | SCORM 1.2 packaging rules |
| `scorm2004` | Multi-SCO / sequencing |
| `standalone` | Standalone layout |
| `xapi` | `tracking.xapi.activityIri` (HTTPS) |
| `cmi5` | cmi5 + xAPI tracking |

## `build`

```bash title="lxpack build"
lxpack build
lxpack build --target scorm12
lxpack build --target scorm2004 -o ./out/course.zip
lxpack build --target standalone --dir -o ./out/standalone
```

| Option | Description |
|--------|-------------|
| `-t, --target` | `scorm12` (default), `scorm2004`, `standalone`, `xapi`, `cmi5` |
| `-o, --output` | Output ZIP or directory path (relative paths resolve inside the materialized course for `--lessonkit`) |
| `--dir` | Unpacked directory instead of ZIP |
| `--lessonkit <path>` | Build from `lessonkit.json` interchange instead of `course.yaml` |
| `--spa-lesson <id=path>` | SPA lesson id and **absolute** path to dist folder with `index.html` (repeatable) |
| `--spa-dist <path>` | Shorthand when the interchange has a single SPA lesson |

LessonKit interchange build (no `course.yaml` in cwd):

```bash title="lxpack build --lessonkit"
lxpack build --lessonkit ./lessonkit.json \
  --spa-lesson spa1=/abs/path/to/spa/dist \
  --target scorm12
```

See [lessonkit.json interchange](lessonkit-interchange.md) and [LessonKit interoperability](../guides/lessonkit-interoperability.md).

Default output directory: `.lxpack/` (or `output.dir` in `lxpack.config.json`).

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Validation or build error |

## See also

- [lxpack.config.json](lxpack-config.md)  
- [lessonkit.json interchange](lessonkit-interchange.md)  
- [Troubleshooting](troubleshooting.md)  
- [Your first course](../getting-started/your-first-course.md)
