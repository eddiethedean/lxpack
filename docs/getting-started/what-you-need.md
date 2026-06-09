# What you need

Before you create a course, gather these tools. You do **not** need to be an application developer — only to edit text files and run a few `lxpack` commands in Terminal.

## 1. A computer

LXPack runs on **macOS**, **Windows**, or **Linux**. You need administrator rights (or IT approval) to install Node.js.

## 2. Node.js (version 18 or newer)

Node.js is a free runtime that powers the `lxpack` command. LXPack supports **Node.js 18 and 20**; either is fine. **Node 20 LTS** is recommended when your organization allows it.

=== "macOS"

    1. Open [https://nodejs.org](https://nodejs.org) and download the **LTS** installer.
    2. Run the installer and accept the defaults.
    3. Open **Terminal** (search “Terminal” in Spotlight).
    4. Type `node --version` and press Enter. You should see `v18` or `v20` (for example `v20.19.0`).

=== "Windows"

    1. Open [https://nodejs.org](https://nodejs.org) and download the **LTS** installer.
    2. Run the installer. Leave “Add to PATH” enabled.
    3. Open **Command Prompt** or **PowerShell** (search in the Start menu).
    4. Type `node --version` and press Enter. You should see `v18` or `v20` (for example `v20.19.0`).

!!! tip "Corporate machines"
    If IT manages software installs, ask them to install **Node.js 18 LTS or 20 LTS**. You only need Node and npm (included with Node) — not a full development stack.

## 3. The LXPack command-line tool

After Node is installed, install LXPack globally:

```bash title="npm install -g @lxpack/cli"
npm install -g @lxpack/cli
```

Verify:

```bash title="lxpack --version"
lxpack --version
```

**Success looks like:** a version number (for example `0.7.0`), not “command not found.”

Details: [Install the CLI](install-cli.md).

## 4. A text editor

You will edit Markdown lessons, a settings file (`course.yaml`), and sometimes HTML for activities.

| Editor | Good for |
|--------|----------|
| [Visual Studio Code](https://code.visualstudio.com/) | Free, widely used, optional extensions |
| TextEdit (Mac) / Notepad (Windows) | Fine for small edits if you save as plain text |
| [Cursor](https://cursor.com/) | IDE with file tree and integrated Terminal — [with Claude](../guides/workflow-claude-code.md) or [without Claude](../guides/workflow-cursor.md) |

!!! warning "Save as plain text"
    Word processors (Microsoft Word, Google Docs exported oddly) can break YAML and Markdown. Use `.md`, `.yaml`, and `.html` files in a normal code or text editor.

## 5. Claude (Design or chat)

LXPack is built for **AI-assisted authoring**:

- **Claude Design** — storyboarding, lesson drafts, quiz wording, HTML activity ideas.
- **Claude in the browser** — same, if you do not use Design.
- **Claude Code in Cursor** — optional; see the [developer workflow](../guides/workflow-claude-code.md).

You paste learning objectives and file contents into Claude; Claude returns text you save into your course folder.

## 6. Terminal comfort (a little)

You will run commands like `lxpack preview` and `lxpack validate`. You copy them from this documentation, paste into Terminal, and press Enter.

You do **not** need to learn programming. See [Your first course](your-first-course.md) for a guided walkthrough.

## Optional (later)

| Tool | When you might want it |
|------|-------------------------|
| **Git** | Version history and team collaboration — [developer workflow](../guides/workflow-claude-code.md) |
| **pnpm** | Only if you hack on LXPack itself from source |

## Next step

[Install the CLI](install-cli.md) → [Your first course](your-first-course.md)
