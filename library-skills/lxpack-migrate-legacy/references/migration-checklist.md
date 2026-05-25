# Legacy → LXPack checklist

## Discovery

- [ ] List modules and learning objectives
- [ ] Document branching (roles, remediation, optional modules)
- [ ] Confirm LMS standard with admin (SCORM 1.2 / 2004 / xAPI / cmi5)
- [ ] Export text from legacy tool (Word, PDF, or copy from slides)
- [ ] **HTML course only:** file tree of pages; mark static vs interactive vs quiz; note asset folders and completion scripts

## Pilot module

- [ ] `lxpack init <name>`
- [ ] One `lessons/*.md` per major topic
- [ ] `course.yaml` lesson entries with unique ids
- [ ] Quiz in `assessments/*.yaml` if needed
- [ ] HTML lab if legacy had interaction (use interaction template)
- [ ] `lxpack validate`
- [ ] `lxpack preview` + stakeholder sign-off
- [ ] `lxpack build --target <confirmed>` + LMS staging test

## Full course

- [ ] Repeat per module
- [ ] Add `variables` / `flow` if non-linear
- [ ] Add `tracking.xapi` if xAPI/cmi5
- [ ] Archive legacy source (reference only)
- [ ] Document production ZIP version for LMS team

## Install Library Skills (optional)

From LXPack repo:

```bash
./library-skills/install.sh --global
```
