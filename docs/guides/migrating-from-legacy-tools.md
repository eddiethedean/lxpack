# Migrating from legacy tools

This guide helps teams move from **slide-centric authoring** (Articulate Storyline, Rise, Adobe Captivate, Lectora, etc.) to **LXPack + Claude**. You keep your instructional design; you change how content is stored and published.

## Concept map

| Legacy (Storyline / Rise / Captivate) | LXPack |
|---------------------------------------|--------|
| Project file (`.story`, `.cptx`, Rise web) | **Folder** with `course.yaml` + content files |
| Slide / scene | **Lesson** (`markdown`, `html`, or `component`) |
| Slide layers, states | **HTML interaction** or separate lessons |
| Triggers (“when timeline starts…”) | **`flow`** rules + `variables`, or JavaScript in HTML |
| Quiz question bank | **`assessments/*.yaml`** |
| Result slide / pass-fail | `passingScore`, `tracking.completion`, optional `flow` |
| Preview / Review | `lxpack preview` |
| Publish to LMS | `lxpack build --target scorm12` (or scorm2004 / xapi / cmi5) |
| SCORM tracking | Built into export — no separate trigger wiring |

## What you can drop

- Binary project files learners never saw  
- Storyline player chrome — LXPack runtime provides navigation  
- Embedded font dependencies tied to the old tool  

## What you must rewrite

| Asset | Approach |
|-------|----------|
| Slide text | Markdown lessons — Claude can convert Word/PPT outlines |
| Simple knowledge checks | YAML assessments |
| Drag-drops, hotspots, simulations | HTML under `interactions/` — Claude drafts HTML; you validate |
| Complex animations | Simplify or rebuild as HTML/CSS; LXPack is web-native, not timeline-based |
| Shared question banks | One YAML file per quiz; duplicate questions as needed |

!!! note "Parity expectation"
    Pixel-perfect recreation of every Storyline trigger is rarely worth it. Aim for **equivalent learning outcomes** and accessible web interactions.

## Migration checklist

### 1. Discovery (1–2 days)

- [ ] List modules and learning objectives  
- [ ] Note branching (role paths, remediation)  
- [ ] Confirm LMS standard: SCORM 1.2, 2004, xAPI, or cmi5  
- [ ] Export text from legacy tool (Word, PDF, or copy from slides)  

### 2. Pilot module (1 week)

- [ ] `lxpack init <course-name>`  
- [ ] Rebuild **one** module: lessons + one quiz + one lab if needed  
- [ ] `lxpack validate` → `lxpack preview` → stakeholder sign-off  
- [ ] `lxpack build` → upload to **LMS staging**  
- [ ] Test completion and quiz scoring with real LMS accounts  

### 3. Scale content

- [ ] Repeat authoring loop per module ([Claude Design workflow](workflow-claude-design.md))  
- [ ] Map variables/branching to `flow` ([Branching and paths](branching-and-paths.md))  
- [ ] Centralize style in Markdown + component callouts  

### 4. Cutover

- [ ] Retire legacy source-of-truth (archive `.story` for reference only)  
- [ ] Document which ZIP version is in production  
- [ ] Train authors on validate/preview habit  

## Storyline-specific tips

| Storyline feature | LXPack approach |
|-------------------|-----------------|
| Layers | Separate lessons or one HTML page with show/hide |
| Variables | `variables` in `course.yaml` + `lxpack.setVariable` from HTML if needed |
| xAPI send statement | Runtime `XapiReporter` when built with `--target xapi` |
| Lightbox slides | New markdown lesson or modal in custom HTML |
| Result slide | Assessment pass + `tracking.completion` |

## Rise-specific tips

Rise blocks map cleanly to Markdown and components:

| Rise block | LXPack |
|------------|--------|
| Text / quote | Markdown lesson |
| Interactive accordion | Markdown or `callout` component |
| Labeled graphic | `image-card` component or HTML |
| Quiz | `assessments/*.yaml` |
| Continue block | Linear `lessons` order (or `flow`) |

## Team roles after migration

| Role | Responsibility |
|------|----------------|
| **ID / LXD** | Content, YAML, Claude prompts, preview reviews |
| **Developer** (optional) | Complex HTML interactions, Git, CI |
| **LMS admin** | Import ZIP, sandbox testing, production promote |

## Compared to Storyline (summary)

| Feature | Storyline | LXPack |
|---------|-----------|--------|
| AI-native authoring | No | Yes (Claude + files) |
| Git-friendly source | Weak | Strong (text files) |
| Web-native output | Partial | Yes |
| Custom interactions | Difficult | HTML + optional JS |
| Open ecosystem | Limited | Extensible packages (roadmap) |

## Next steps

- [Workflow with Claude Design](workflow-claude-design.md)  
- [Export to LMS](export-to-lms.md)  
- [Glossary](../getting-started/glossary.md)
