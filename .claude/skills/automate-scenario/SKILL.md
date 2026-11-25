---
name: automate-scenario
description: Automate one Demo Web Shop scenario end to end in the right layer (api, ui or UI + API integration). It analyzes existing coverage, probes the live site, extends the API client / page object, writes the spec, reviews, runs and fixes until green. Use when the user says "automate <flow>", "add tests for <feature/endpoint>", gives a plan section, or asks to add cases to an existing spec.
---

# Automate one scenario, end to end

## 1. Read the standing instructions first

Read **`ai-agent/prompts/scenario-rollout.md`** and follow it. It is the single source of truth for this workflow
(order of work, non-negotiables, agent choices). Read it every time, because it gets updated.

Also obey `CLAUDE.md` (auto-loaded), `ai-agent/core/rules.md` and `ai-agent/tasks/*`.

## 2. Resolve the inputs

```
SCENARIO:  <flow or endpoint>     ← usually the only thing typed
LAYER:     <api | ui | integration>
SPEC:      <tests/<layer>/<Area>_<Layer>_Test.spec.js>
CLIENT:    <src/api/<Area>_Api.js or —>
PAGE:      <src/pages/<Name>_Page.js or —>
PLAN:      <specs/<area>-plan.md or —>
TAG:       <@smoke | none>
```

### Defaults
| Field | Default |
|---|---|
| LAYER | integration when data crosses UI ↔ server; api for an endpoint contract; ui for pure browser behaviour |
| SPEC | the existing spec for that area and layer (extend it); otherwise `tests/<layer>/<Area>_<Layer>_Test.spec.js` |
| CLIENT / PAGE | the existing one for the area (`Cart_Api.js`, `Cart_Page.js`, …) |
| PLAN | none: plan inline (or `test-planner` for a new area) |
| TAG | none; the area's main happy path gets `@smoke` |

## 3. Confirm the plan before writing

State the resolved header, what already exists (client methods, page actions, fixtures, tests), what you'll add,
and the case list with the **live-observed** result per case (marking any `DEFECT-n`). Then implement.

## 4. Finish properly

Run `npx playwright test <SPEC> --retries=0`, read the output, fix the root cause, re-run until green, then
`--repeat-each=2` and `npm test`. Report: cases added, evidence observed, new findings, what's still open.
Offer `/make-doc`.
