# Scenario rollout: automate one scenario, end to end

Reusable prompt. Paste the **Fill in** block (or use `/automate-scenario`). Everything below it is the standing
instruction set and does not need to be retyped.

---

## Fill in

```
SCENARIO:  <a user flow or endpoint, e.g. "apply a discount code", "POST /addproducttocart/details">
LAYER:     <api | ui | integration>
SPEC:      <tests/<layer>/<Area>_<Layer>_Test.spec.js>
CLIENT:    <src/api/<Area>_Api.js, or —>
PAGE:      <src/pages/<Name>_Page.js, or —>
PLAN:      <specs/<area>-plan.md, or —>
TAG:       <@smoke | none>
```

Anything omitted is inferred: the layer from the wording ("verify in the UI that…" → integration), the spec path
from area + layer, and `TAG` is `@smoke` only for an area's main happy path.

---

## Conventions

Follow `CLAUDE.md` (auto-loaded) and `ai-agent/`: `core/rules.md`, `tasks/generate-client.md`,
`tasks/generate-pom.md`, `tasks/generate-spec.md`, `tasks/review-test.md`, `tasks/heal-test.md`. Those win over this file.

## Workflow

```
Analyze → Plan → Probe live → Client / POM → Spec → Review → Run → Diagnose → Fix → Re-run → Report
```

1. **Analyze.** Grep `src/api/`, `src/pages/`, `src/data/`, `tests/` for what exists. **Report what is missing.**
2. **Plan.** List the cases (coverage checklist in `tasks/generate-spec.md`) with the expected result for each.
   Use `test-planner` for a new area and save to `specs/<area>-plan.md`.
3. **Probe live, before writing a single assertion.** HTTP for endpoints (status, location, body, timing), the
   browser for UI (markup, AJAX behaviour, messages). Where actual ≠ expected, it's a finding: assert actual,
   annotate, and add a `DEFECT-n` / `ROOT-CAUSE-n` row.
4. **Client / POM first.** Add only what's missing (`api-client-writer`, `pom-writer`).
5. **Spec.** `test-generator` from a plan, or `spec-writer` from a flow.
6. **Review.** `test-reviewer` (read-only); address the critical issues.
7. **Run.** `npx playwright test <SPEC> --retries=0`, then `--repeat-each=2` to prove independence.
8. **Diagnose → fix → re-run** until green for the right reason (`test-healer`). Then `npm test`.
9. **Report.** Cases added, real evidence, new findings, anything open. Offer `/make-doc`.

## Non-negotiables
- No assertion on a status, message or price you didn't observe live.
- No invented endpoints; no hardcoded users, e-mails, hosts.
- Preconditions through the API; integration verifies through the other side.
- Don't weaken an assertion to get green.
