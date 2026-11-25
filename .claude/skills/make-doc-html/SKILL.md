---
name: make-doc-html
description: Document a finished automation run as a docs/ report. Writes ONLY the .html teaching reference (no .md), with Expected vs Actual (live) evidence (HTTP + UI, plus the run's video/trace folder), DEFECT-n / ROOT-CAUSE-n / OPEN-QUESTION-n findings, a corrections log and code explanations of the clients, page objects, fixtures and specs. Use when the user says "/make-doc-html" or asks for just the HTML report.
---

# Document a run: `.html` only

## 1. Read the standing instructions first

Read **`ai-agent/prompts/doc-rollout.md`** and follow it. Read it every time, because it gets updated.
Also obey `CLAUDE.md` (auto-loaded).

## 2. Write ONE file

`docs/<Feature>-Test-Automation-<YYYY-MM>.html` and nothing else. **Don't create or update the `.md` twin.**

The HTML carries both halves: the audit trail (scope, run command, structure, evidence, findings, corrections log,
follow-ups) **and** the teaching walkthrough. Self-contained: inline CSS, no external assets.

### Non-negotiables (details in `doc-rollout.md`)
- **Start from `ai-agent/prompts/doc-template.html`.** Keep its `<style>` block verbatim.
- **Framework FIRST (§8), specs SECOND (§9).**
- **Teach every construct Way-1 / Way-2.**

## 3. Finish properly

Add the session row (and any `FU-n`) to `docs/Claude-Session-Index.html`, then report the file written and the
headline outcome. Never edit specs, clients, page objects or utils while documenting.
