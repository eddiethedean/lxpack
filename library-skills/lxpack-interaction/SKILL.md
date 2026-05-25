---
name: lxpack-interaction
description: >-
  Create or fix LXPack HTML interaction labs (interactions/*/index.html) with
  window.parent.lxpack.track for completion and branching. Use for click labs,
  simulations, or embedded activities in lxpack courses.
license: Apache-2.0
metadata:
  lxpack-version: "0.3.0"
---

# LXPack HTML interactions

## Register in course.yaml

```yaml
lessons:
  - id: phishing_lab
    title: Phishing lab
    type: html
    path: interactions/phishing-lab
```

Folder: `interactions/phishing-lab/index.html`

## Tracking hook (required for completion / flow)

On learner success:

```javascript
if (window.parent.lxpack) {
  window.parent.lxpack.track({ type: 'interaction', id: 'EVENT_ID' });
}
```

For `flow` with `interaction.done: phishing_lab`, the condition uses the **lesson id** (`phishing_lab`), not `EVENT_ID`.

## Template

Read `references/interaction-template.html` when generating a new file.

## Accessibility

- Use `<button>` or elements with `role="button"`, `tabindex="0"`, keyboard Enter/Space
- Visible focus styles
- Do not rely on color alone for feedback

## Validate

From course root:

```bash
lxpack validate
lxpack preview
```

## Assets

Keep images/scripts beside `index.html` or in `assets/` with relative paths. All files must stay inside the course directory.
