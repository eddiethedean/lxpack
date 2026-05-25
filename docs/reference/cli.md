# CLI reference

Install: `npm install -g @lxpack/cli` (Node.js 20+).

Commands discover the course by walking up from the current directory until they find `course.yaml`.

## Commands

| Command | Description |
|---------|-------------|
| `lxpack init <name>` | Create a new course (`-d, --dir`, `-f, --force`) |
| `lxpack preview` | Local preview server (`-p, --port`, `-H, --host`) |
| `lxpack validate` | Validate structure (`-t, --target` for export rules) |
| `lxpack build` | Package for LMS (`-t, --target`, `-o, --output`, `--dir`) |

## `init`

```bash
lxpack init my-course
lxpack init my-course --dir ./courses/my-course
lxpack init my-course --force
```

`--dir` must stay inside the current working directory.

## `preview`

```bash
lxpack preview
lxpack preview -p 4000 -H 0.0.0.0
```

Default: `http://127.0.0.1:3847`

Fails if validation fails (same as build).

## `validate`

```bash
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

```bash
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
