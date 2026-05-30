LXPack reports progress to the **LMS** (SCORM) or **LRS** (xAPI/cmi5) depending on export target.

## Completion threshold

```yaml
tracking:
  completion:
    threshold: 0.9
```

Learners complete the course when enough lessons (and requirements) are satisfied — here, **90%** of required progress.

Tune with your instructional design: lower for survey-style courses, `1.0` for strict completion.

## SCORM 1.2 / 2004

- Progress stored in `cmi.suspend_data` (size-limited; runtime compresses data)
- Quiz pass/fail and attempts tracked in suspend data
- Preview can simulate SCORM APIs via `preview.scormMode` — [Preview guide](../guides/preview-and-review.md)

Validate SCORM 2004 packages in SCORM Cloud or your LMS staging environment before production.

## xAPI / cmi5

Require stable HTTPS activity identifier:

```yaml
tracking:
  xapi:
    activityIri: "https://training.example.com/courses/onboarding-2026"
    displayName: Onboarding 2026
```

Build:

```bash title="lxpack validate --target xapi"
lxpack validate --target xapi
lxpack build --target xapi
```

Runtime sends statements (launch, progress, interactions, assessments) via `XapiReporter`. Preview can log statements when `xapi.preview` is set in config.

### cmi5 note

cmi5 packages include `cmi5.xml`. When the LMS launch URL includes a `fetch` parameter, the runtime POSTs to that URL once per session to obtain an `auth-token` for LRS requests (cached in `sessionStorage` on refresh). The launch URL must still include `endpoint` (and typically `actor`, `registration`).

## HTML interaction tracking

```javascript
window.parent.lxpack.track({ type: 'interaction', id: 'event_name' });
```

Used for analytics and `interaction.done` flow conditions.

## Assessment events

Submitting a quiz updates progress and may trigger `assessment.passed` in `flow`.

## Related

- [Export to LMS](../guides/export-to-lms.md)
- [Developer SPEC](../developer/SPEC.md)
