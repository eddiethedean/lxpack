Optional per-course settings. If missing, defaults apply.

## Example

```json
{
  "exports": {
    "defaultTarget": "scorm12"
  },
  "preview": {
    "scormMode": "local"
  },
  "output": {
    "dir": ".lxpack"
  },
  "xapi": {
    "preview": {
      "logStatements": true,
      "mockLrs": true
    }
  }
}
```

## `exports.defaultTarget`

| Value | Description |
|-------|-------------|
| `scorm12` | SCORM 1.2 ZIP (common default) |
| `scorm2004` | SCORM 2004 multi-SCO |
| `standalone` | HTML package without SCORM manifest |
| `xapi` | Tin Can / xAPI package |
| `cmi5` | cmi5 package |

Used when you run `lxpack build` without `--target`.

## `preview.scormMode`

| Value | Behavior |
|-------|----------|
| `local` | Progress in `localStorage` (default) |
| `scorm12` | SCORM 1.2 API simulator |
| `scorm2004` | SCORM 2004 API simulator |

See [Preview and review](../guides/preview-and-review.md).

## `output.dir`

Folder for build artifacts (default `.lxpack`). Path must stay inside the course directory.

## `xapi.preview`

| Field | Description |
|-------|-------------|
| `logStatements` | Log statements to browser console in preview |
| `mockLrs` | Queue statements in `localStorage` for debugging |

Requires `tracking.xapi` in `course.yaml`.

## Security note

`lxpack.config.json` is **not** served to learners in preview or export (blocked like `course.yaml`).

## Related

- [CLI reference](cli.md)
- [Export to LMS](../guides/export-to-lms.md)
