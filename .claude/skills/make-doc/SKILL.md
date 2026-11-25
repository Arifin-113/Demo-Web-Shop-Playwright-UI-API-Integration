---
name: make-doc
description: Document a finished automation run as a docs/ report. Writes BOTH the .md audit trail and the .html teaching reference, with Expected vs Actual (live) evidence (HTTP + UI, plus the run's video/trace folder), DEFECT-n / ROOT-CAUSE-n / OPEN-QUESTION-n findings and a corrections log. Use when the user says "document it", "/make-doc", or asks for a report after a spec has gone green.
---

# Document a run: `.md` + `.html`

## 1. Read the standing instructions first

Read **`ai-agent/prompts/doc-rollout.md`** and follow it. It is the single source of truth (file naming, required
sections, evidence from the report's `data/` folder, finding-ID rules, corrections log, session index). Read it
every time, because it gets updated.

Also obey `CLAUDE.md` (auto-loaded), especially "Documenting findings — ID format" and the canonical findings tables.

## 2. Write BOTH files

- `docs/<Feature>-Test-Automation-<YYYY-MM>.md`: the plain audit trail.
- `docs/<Feature>-Test-Automation-<YYYY-MM>.html`: the same content **plus** the teaching walkthrough.

Keep the two consistent.

### Non-negotiables for the HTML (details in `doc-rollout.md`)
- **Start from `ai-agent/prompts/doc-template.html`.** Keep its `<style>` block verbatim.
- **Framework FIRST (§8), specs SECOND (§9)**: env → config → clients → page objects → fixtures (the session
  bridge) → data → utils, then the specs layer by layer.
- **Teach every construct Way-1 / Way-2.**

## 3. Finish properly

Add the session row (and any `FU-n`) to `docs/Claude-Session-Index.html`, then report the files written and the
headline outcome. Never edit specs, clients, page objects or utils while documenting.
