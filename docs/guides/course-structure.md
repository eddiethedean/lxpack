# Course structure

An LXPack course is a **folder on disk**. The CLI finds it by looking for `course.yaml` in the current directory or parent folders.

## Folder layout

After `lxpack init my-course`:

```text
my-course/
  course.yaml           # Required — title, lessons, assessments, optional flow/tracking
  lxpack.config.json    # Optional — export defaults, preview, output directory
  lessons/              # Markdown lesson files
  interactions/         # HTML activity folders (each has index.html)
  assessments/          # Quiz YAML (authoring only)
  assets/               # Images, PDFs, downloads
  components/           # Optional custom widget overrides
  theme/                # Reserved for future theming
  .lxpack/              # Generated ZIPs (created by build)
```

## What each folder is for

| Folder | You put… | Learners see… |
|--------|----------|----------------|
| `lessons/` | `.md` files with headings and text | Rendered pages in the course player |
| `interactions/` | `index.html` + assets per activity | Embedded activity in a lesson step |
| `assessments/` | `.yaml` quiz definitions | Questions inside the built course (not raw YAML) |
| `assets/` | Images referenced from markdown or HTML | Static files copied into the package |
| `components/` | Advanced: custom widget bundles | Only if referenced in `course.yaml` |

!!! warning "Do not edit `.lxpack/` by hand"
    It is build output. Delete it anytime; run `lxpack build` again to regenerate.

## `course.yaml` at a glance

Think of it as **Settings + Table of contents**:

- **Course metadata** — `title`, `version`, `description`
- **`lessons`** — ordered list of steps (`id`, `title`, `type`, file or path)
- **`assessments`** — quiz files referenced by `id`
- **`variables`** / **`flow`** — optional branching (v0.2+)
- **`tracking`** — completion threshold, optional xAPI IRI
- **`runtime.theme`** — CSS class name on the player (`modern`, etc.)

Full reference: [course.yaml](../reference/course-yaml.md).

## `lxpack.config.json`

Optional project settings:

```json
{
  "exports": { "defaultTarget": "scorm12" },
  "preview": { "scormMode": "local" },
  "output": { "dir": ".lxpack" }
}
```

See [lxpack.config.json](../reference/lxpack-config.md).

## Example courses to copy

| Path in repository | Teaches |
|--------------------|---------|
| `examples/security-awareness` | Minimal linear course |
| `examples/branching-demo` | Variables, flow, components |
| `examples/xapi-awareness` | xAPI tracking |
| `examples/cmi5-demo` | cmi5 export |

## Next

- [Writing lessons](writing-lessons.md)  
- [Workflow overview](workflow-overview.md)
