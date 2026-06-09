# Building interactions

--8<-- "copy-tip.md"

**Interactions** are small web pages — labs, simulations, click-to-reveal activities — stored under `interactions/<name>/index.html`.

## Register an HTML lesson

```yaml
lessons:
  - id: phishing_lab
    title: Phishing lab
    type: html
    path: interactions/phishing-lab
```

The folder name must match `path` (for example `interactions/phishing-lab/index.html`).

## Minimal HTML template

Copy this skeleton; customize the body. Keep the **tracking** script so LXPack knows the learner completed the activity.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phishing lab</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <h1>Report the suspicious email</h1>
  <button type="button" id="report">Report phishing</button>
  <p id="feedback" hidden></p>
  <script>
    document.getElementById('report').addEventListener('click', () => {
      document.getElementById('feedback').hidden = false;
      document.getElementById('feedback').textContent = 'Correct — reported to security.';
      if (window.parent.lxpack) {
        window.parent.lxpack.track({ type: 'interaction', id: 'phishing_reported' });
      }
    });
  </script>
</body>
</html>
```

### Why `window.parent.lxpack`?

Interactions run inside the course player iframe. The parent window exposes `lxpack.track()` so completion and branching (`interaction.done` in `flow`) work.

## Ask Claude to build an interaction

Provide:

1. Scenario and correct learner action  
2. This template  
3. Requirement: “Call `window.parent.lxpack.track({ type: 'interaction', id: '...' })` on success.”

Review HTML for accessibility (buttons, labels, keyboard support).

## Branching on interaction completion

In `course.yaml`:

```yaml
flow:
  - when:
      interaction:
        done: phishing_lab
    goto: advanced_topic
```

The `done` value matches the lesson `id` of the **html** lesson, not the folder name. The `id` passed to `track()` on success may be a different event name; the player maps completion to the lesson id for flow rules.

## Assets

Put images next to `index.html` or in `assets/` and reference with relative paths. All files must stay inside the course directory.

## Validate and preview

```bash title="lxpack validate"
lxpack validate
lxpack preview
```

Open the HTML lesson and confirm the activity marks complete (and branching fires if configured).

## Example in the repository

See `examples/security-awareness/interactions/phishing-lab/index.html`.

## Next

- [Branching and paths](branching-and-paths.md)  
- [Prompts for Claude](prompts-for-claude.md)
