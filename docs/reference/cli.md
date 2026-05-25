# CLI reference

--8<-- "copy-tip.md"

**v0.3.2** · Requires Node.js 20+ and `@lxpack/cli` on your PATH.

## Copy-paste commands

--8<-- "commands/install.md"

--8<-- "commands/new-course.md"

--8<-- "commands/core-workflow.md"

Commands discover the course by walking up from the current directory until they find `course.yaml`.

## Commands

| Command | Description |
|---------|-------------|
| `lxpack init <name>` | Create a new course (`-d, --dir`, `-f, --force`) |
| `lxpack preview` | Local preview server (`-p, --port`, `-H, --host`) |
| `lxpack validate` | Validate structure (`-t, --target` for export rules) |
| `lxpack build` | Package for LMS (`-t, --target`, `-o, --output`, `--dir`) |

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
```

Default: `http://127.0.0.1:3847`

Fails if validation fails (same as build).

## `validate`

```bash title="lxpack validate"
lxpack validate
lxpack validate --target scorm12
lxpack validate --target xapi
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
| `-o, --output` | Output ZIP or directory path |
| `--dir` | Unpacked directory instead of ZIP |

Default output directory: `.lxpack/` (or `output.dir` in `lxpack.config.json`).

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Validation or build error |

## See also

- [lxpack.config.json](lxpack-config.md)  
- [Troubleshooting](troubleshooting.md)  
- [Your first course](../getting-started/your-first-course.md)
