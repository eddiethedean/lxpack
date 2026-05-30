# Prompts for Claude and Cursor

Copy-paste prompts for **Claude Design**, **Claude chat**, **Claude Code**, and **Cursor**. Each block has a **clipboard icon** (top-right).

--8<-- "copy-tip.md"

Replace `ALL_CAPS` placeholders. After every change, run:

--8<-- "commands/core-workflow.md"

---

## Session starter (paste once per chat)

Use this at the start of a new Claude or Cursor conversation so the model knows LXPack rules.

```text title="LXPack session context (v0.5.0)"
You are helping author an LXPack v0.6.2 course.

Rules:
- Course root contains course.yaml (manifest), lessons/*.md, assessments/*.yaml, interactions/*/index.html, optional lxpack.config.json.
- Lesson types: markdown (file:), html (path: interactions/...), component (component: callout|checklist|image-card).
- Lesson ids: lowercase letters, numbers, underscores only. Must be unique.
- YAML uses spaces, not tabs. One correct: true per MCQ question.
- Do not invent lxpack CLI commands beyond: init, preview, validate, build (--target scorm12|scorm2004|standalone|xapi|cmi5).
- After edits, remind me to run: lxpack validate

My course title: COURSE_TITLE
Audience: AUDIENCE
LMS export target (if known): scorm12 | scorm2004 | xapi | cmi5 | standalone
```

---

## Authoring lessons

### Write a Markdown lesson

```text title="Author a Markdown lesson"
Write a Markdown lesson file for LXPack v0.6.2 only (no YAML, no HTML).

Course: COURSE_TITLE
Audience: AUDIENCE
Lesson title: LESSON_TITLE
Learning objectives:
- OBJECTIVE_1
- OBJECTIVE_2

Tone: conversational, about LENGTH minutes to read.
Structure: one # heading, 2–4 ## sections, bullet lists where helpful, short summary at the end.

Output Markdown only. I will save it as lessons/LESSON_ID.md
```

**Then:** add the lesson to `course.yaml` (next prompt).

### Simplify reading level

```text title="Rewrite lesson for plain language"
Rewrite this Markdown lesson for AUDIENCE at approximately READING_LEVEL (e.g. grade 8, general office staff).

Keep the same learning objectives. Shorter sentences. Keep # and ## headings.

PASTE_LESSON_MARKDOWN
```

### Add a component callout (no HTML)

```text title="Add a component lesson to course.yaml"
Add a component lesson to my course.yaml using built-in id "callout".

Lesson id: LESSON_ID
Title: DISPLAY_TITLE
Props: variant info, body one or two sentences about TOPIC.

Return the full updated course.yaml. Do not change other lesson ids.
```

```text title="Paste your course.yaml below the prompt above"
PASTE_COURSE_YAML_HERE
```

---

## Update course.yaml

### Register a new Markdown lesson

```text title="Add markdown lesson to course.yaml"
Here is my course.yaml. Add one new markdown lesson. Do not change or remove existing lesson ids.

New lesson:
- id: LESSON_ID
- title: DISPLAY_TITLE
- type: markdown
- file: lessons/FILENAME.md

Insert it AFTER lesson id: INSERT_AFTER_ID (or at the end if not specified).

Return the complete course.yaml only. Spaces for indentation, no tabs.
```

```text title="Paste course.yaml"
PASTE_COURSE_YAML_HERE
```

### Register an HTML lab lesson

```text title="Add HTML interaction lesson to course.yaml"
Here is my course.yaml. Add one html lesson.

- id: LESSON_ID
- title: DISPLAY_TITLE
- type: html
- path: interactions/FOLDER_NAME

Return the complete course.yaml only.
```

```text title="Paste course.yaml"
PASTE_COURSE_YAML_HERE
```

### Add xAPI tracking for export

```text title="Add tracking.xapi to course.yaml"
My course needs xapi or cmi5 export. Update course.yaml to add:

tracking:
  completion:
    threshold: 0.9
  xapi:
    activityIri: "https://OUR_DOMAIN/courses/COURSE_SLUG"
    displayName: DISPLAY_NAME

activityIri must be HTTPS and stable. Keep existing lessons and assessments.

Return full course.yaml only.
```

```text title="Paste course.yaml"
PASTE_COURSE_YAML_HERE
```

---

## Quizzes and assessments

### Generate a full quiz YAML

```text title="Generate assessment YAML (MCQ)"
Write an LXPack v0.6.2 assessment YAML file (multiple choice only).

id: QUIZ_ID
title: QUIZ_TITLE
passingScore: 0.7
maxAttempts: 3
shuffleChoices: true
showFeedback: immediate

Topic: TOPIC
Write NUMBER questions (e.g. 5). Each question:
- unique id q1, q2, ...
- prompt line
- exactly one choice with correct: true
- optional explanation: one sentence

Output YAML only, no markdown code fences.
```

### Add one question to an existing quiz

```text title="Add one MCQ to existing assessment"
Add one new question to this assessment YAML. Use id qNEXT. Topic: TOPIC. One correct choice.

PASTE_ASSESSMENT_YAML
```

---

## HTML interactions

### Scaffold a click-to-complete lab

```text title="HTML interaction with lxpack.track"
Write one index.html file for LXPack v0.6.2 (single file, inline CSS).

Scenario: SCENARIO
Success action: learner does ACTION
Interaction id for tracking: INTERACTION_ID (must match lesson id if used in flow)

Requirements:
- Accessible button (keyboard works)
- On success: show feedback text
- Call: window.parent.lxpack.track({ type: 'interaction', id: 'INTERACTION_ID' });

Return HTML only.
```

### Fix interaction tracking

```text title="Fix HTML interaction tracking"
This HTML interaction does not mark complete in LXPack preview. Fix tracking only; keep visible UI the same.

Lesson id in course.yaml: LESSON_ID
Required: window.parent.lxpack.track({ type: 'interaction', id: 'CORRECT_ID' });

PASTE_INDEX_HTML
```

---

## Branching and variables

### Design flow rules

```text title="Design variables and flow"
Design LXPack v0.6.2 variables: and flow: blocks for course.yaml.

Scenario: SCENARIO
Existing lesson ids (do not invent others):
- LESSON_ID_1
- LESSON_ID_2
- LESSON_ID_3

Assessment ids:
- QUIZ_ID

Return ONLY variables: and flow: YAML. Use assessment.passed and interaction.done only with ids from the lists above.
```

### Add role-based path (example pattern)

```text title="Role-based branching (template)"
Add variables and flow so learners who pick "manager" in interaction choose_path go to lesson id manager_track, others stay linear.

Existing ids:
- choose_path (html lesson)
- manager_track (markdown)
- final_quiz (assessment)
- wrap_up (markdown)

Return variables: and flow: blocks only.
```

```text title="Paste course.yaml"
PASTE_COURSE_YAML_HERE
```

---

## Cursor and Claude Code (multi-file)

In **Cursor**, reference files with `@course.yaml`, `@lessons/intro.md`, or the whole course folder. In **Claude Code**, open the course directory first.

### Implement one module from an outline

```text title="Cursor: build one module (multi-file)"
@course.yaml

Implement module MODULE_NAME from this outline. Edit only files needed.

Outline:
PASTE_MODULE_OUTLINE

Tasks:
1. Create or update lessons/*.md
2. Update course.yaml lesson list (unique ids, correct file: paths)
3. If quiz needed: assessments/QUIZ_ID.yaml + register under assessments:
4. If lab needed: interactions/FOLDER/index.html + html lesson with path:

When done, list files changed and tell me to run: lxpack validate
```

### Fix everything validate reported

```text title="Cursor: fix validate errors"
@course.yaml

lxpack validate failed with:

PASTE_TERMINAL_OUTPUT

Fix all issues. You may edit course.yaml, lessons/, assessments/, interactions/. Explain each fix briefly. Do not add features I did not ask for.
```

### Review course structure before build

```text title="Cursor: pre-build review"
Review this LXPack course for shipping mistakes:

@course.yaml
@lessons/
@assessments/

Checklist:
- Duplicate lesson ids
- file: or path: pointing to missing files
- flow goto targets that are not lesson ids
- assessment.passed / interaction.done referencing wrong ids
- xAPI builds: tracking.xapi.activityIri present and HTTPS

Output: numbered issues (if any) and suggested fixes. Do not edit files unless I say "apply fixes".
```

### Explain a validate error in plain English

```text title="Explain validate error (non-technical)"
Explain this lxpack validate error in plain language for an instructional designer. Say what file to open and what to change.

Error:
PASTE_ONE_ERROR_LINE

Optional context - course.yaml excerpt:
PASTE_RELEVANT_YAML
```

---

## Migration from legacy tools

### Existing HTML course → inventory (start here)

Use when you have a **folder of HTML pages** (exported SCORM content, Rise web export, custom training site, Captivate HTML5, etc.) and need a plan before moving files.

```text title="Inventory an HTML course for LXPack"
You are migrating an existing multi-page HTML eLearning course into LXPack v0.6.2.

I will paste a directory listing and/or describe the course. Do not create files yet.

LXPack target layout:
  course.yaml
  lessons/*.md              (reading content)
  interactions/<id>/index.html   (clickable labs; one folder per activity)
  assessments/*.yaml          (MCQ quizzes — not embedded in HTML for scoring)
  assets/                   (shared images, optional)

Rules for your analysis:
- LXPack lesson ids: ^[a-zA-Z][a-zA-Z0-9_-]*$ only
- Lesson types: markdown (file:), html (path: interactions/...), component (callout|checklist|image-card)
- Each html lesson = one interactions/<folder>/index.html (iframe in the player)
- Old course index.html / player chrome / SCORM API wrapper: drop or strip — LXPack provides navigation and LMS packaging
- Inline or relative CSS/JS in interactions is fine; fix asset paths to stay inside the course folder
- Quizzes in HTML forms or custom JS: propose assessments/*.yaml instead when possible
- Completion in legacy HTML: map to window.parent.lxpack.track({ type: 'interaction', id: 'LESSON_ID' }) on success, or assessment.passed in flow

Course title: COURSE_TITLE
LMS target (if known): scorm12 | scorm2004 | xapi | cmi5 | standalone

Source material:
PASTE_FILE_TREE_OR_LIST_PAGES_AND_WHAT_EACH_DOES
```

### HTML course → LXPack file plan

```text title="HTML course to LXPack file plan"
From the inventory below, produce an LXPack v0.6.2 file plan only (no full file contents yet).

For each legacy page or section specify:
- proposed lesson id
- type: markdown | html | component
- source: which legacy file(s) content comes from
- output path: lessons/FILE.md | interactions/FOLDER/index.html | assessments/QUIZ.yaml
- notes: assets to copy, scripts to remove, tracking change

End with:
1. Ordered lessons: list for course.yaml
2. assessments: entries if any
3. variables / flow: only if legacy had branching (describe mapping)
4. Pilot order: which 1 module to convert first for validate/preview

Inventory:
PASTE_INVENTORY_FROM_PREVIOUS_STEP_OR_YOUR_OWN_NOTES
```

### Cursor: convert HTML course folder (multi-file)

Open the **existing HTML folder** and an **empty or pilot LXPack course** in the workspace. In Cursor, attach both with `@`.

```text title="Cursor: migrate HTML course into LXPack"
@EXISTING_HTML_FOLDER/
@LXPACK_COURSE_ROOT/course.yaml

Migrate this legacy HTML course into the LXPack course folder (v0.5.0). Work in the LXPack tree only; treat the HTML folder as read-only reference.

Course title: COURSE_TITLE
LMS build target: TARGET (default scorm12)

Do:
1. Create course.yaml (or update) with unique lesson ids and correct file:/path: entries
2. Convert static reading pages → lessons/*.md (preserve headings; drop duplicate nav/footer from every page)
3. Convert interactive pages → interactions/<id>/index.html + matching html lessons in course.yaml
4. Copy images/fonts into assets/ or next to interactions; rewrite src/href to relative paths inside the course
5. Extract quizzes → assessments/*.yaml (one correct: true per question); register under assessments:
6. Replace legacy SCORM/Completion JS with window.parent.lxpack.track on success where the learner must "complete" an html lesson
7. If legacy had branching, add minimal variables: and flow: using assessment.passed and interaction.done

Do not:
- Invent lxpack CLI beyond init, preview, validate, build
- Leave absolute file:// or broken ../ paths outside the course directory
- Ship assessment answers inside interaction HTML

When done, list every file created/changed and remind me:
  lxpack validate --target TARGET
  lxpack preview

File plan to follow (edit if inventory showed gaps):
PASTE_FILE_PLAN_OR_LEAVE_BLANK_FOR_YOU_TO_DERIVE
```

### Convert one legacy HTML page → interaction

```text title="Single HTML page to LXPack interaction"
Convert this legacy HTML page into one LXPack interaction folder.

Output:
1. Full index.html (single file; inline or relative CSS/JS only)
2. Suggested lesson id and course.yaml snippet (html lesson with path: interactions/FOLDER)
3. List of asset files to copy beside index.html

Requirements:
- Remove standalone course nav, SCORM wrapper, and duplicate headers if LXPack will own navigation
- Keep learner-visible UI and behavior equivalent
- On success action ACTION: call window.parent.lxpack.track({ type: 'interaction', id: 'LESSON_ID' })
- Accessible controls (buttons, labels, keyboard)
- Fix image/script paths to be relative to the interaction folder

Lesson id for tracking (match course.yaml): LESSON_ID
Interaction folder name: FOLDER_NAME

Legacy HTML:
PASTE_HTML_OR_ATTACH_FILE
```

### Legacy HTML quiz → assessment YAML

```text title="Extract quiz from HTML to assessment YAML"
This quiz lives inside legacy HTML (form, custom JS, or question divs). Extract it into LXPack assessment YAML (MCQ only).

Quiz id: QUIZ_ID
Title: QUIZ_TITLE
passingScore: 0.7
showFeedback: immediate

Rules: one correct: true per question; unique question ids q1, q2, ...

Legacy quiz markup or script:
PASTE_QUIZ_HTML_OR_JS
```

### Storyline / Rise text → Markdown

```text title="Convert slide text to Markdown lesson"
Convert this legacy eLearning slide text into one LXPack Markdown lesson.

Rules:
- Use # for title, ## for sections
- Remove slide numbers and "click next" fluff
- Keep scenarios and questions as readable prose
- Do not output YAML

Lesson title: LESSON_TITLE
Audience: AUDIENCE

Legacy content:
PASTE_SLIDE_TEXT_OR_SCRIPT
```

### Outline → file plan

```text title="Outline to LXPack file plan"
Convert this training outline into an LXPack v0.6.2 file plan (no file contents yet).

Outline:
PASTE_OUTLINE

For each item provide:
- lesson id (lowercase_underscore)
- type: markdown | html | component
- filename or interaction folder
- assessment id if quiz

End with suggested order in course.yaml lessons: list.
```

### Storyline quiz → YAML

```text title="Convert quiz copy to assessment YAML"
Convert this quiz copy into LXPack assessment YAML (MCQ).

Quiz id: QUIZ_ID
Title: QUIZ_TITLE
passingScore: 0.7
showFeedback: immediate

Legacy quiz:
PASTE_QUESTIONS_AND_ANSWERS

One correct choice per question. Output YAML only.
```

---

## Export and LMS

### Choose build target

```text title="Choose lxpack build --target"
Help pick lxpack build --target for our LMS.

LMS: LMS_NAME
Requirements from admin or RFP:
PASTE_REQUIREMENTS

Options: scorm12, scorm2004, standalone, xapi, cmi5

Reply with:
1. Recommended target and why
2. course.yaml changes (especially tracking.xapi if needed)
3. Exact commands: lxpack validate --target ... and lxpack build --target ...
```

### Pre-upload checklist for LMS admin

```text title="LMS handoff checklist"
Generate a short handoff note for our LMS administrator.

Course: COURSE_TITLE
Built with: lxpack build --target TARGET
Completion threshold: THRESHOLD
Quizzes: list ids and passingScore

Include: what to test in staging (launch, complete one lesson, pass/fail quiz, resume if SCORM).
```

---

## Review and quality

### Stakeholder review script

```text title="Reviewer walkthrough script"
Write a 10-minute reviewer script for lxpack preview of course COURSE_TITLE.

Audience playing the role: ROLE (e.g. new hire manager)
Include: which lessons to open, what to click in the lab, what score to expect on the quiz, what "done" looks like.
```

### Accessibility pass (content)

```text title="Accessibility content review"
Review this lesson Markdown for accessibility best practices (headings in order, link text, no wall of text). Suggest concrete edits.

PASTE_LESSON_MARKDOWN
```

---

## Quick reference

| Goal | Prompt section above |
|------|----------------------|
| Start a new chat | Session starter |
| New lesson text | Author a Markdown lesson |
| Update table of contents | Add markdown lesson to course.yaml |
| New quiz | Generate assessment YAML |
| Clickable lab | HTML interaction with lxpack.track |
| Branching | Design variables and flow |
| Cursor multi-file edit | Cursor: build one module |
| Storyline migration | Convert slide text / quiz copy |
| HTML course folder | Inventory → file plan → Cursor migrate |
| One HTML lab page | Single HTML page to LXPack interaction |
| LMS package | Choose build target |

## Related

- [Workflow with Claude Design](workflow-claude-design.md)
- [Workflow with Claude Code](workflow-claude-code.md)
- [Workflow with Cursor (without Claude)](workflow-cursor.md) — same prompts work in Cursor Chat without Agent
- [Troubleshooting](../reference/troubleshooting.md)
