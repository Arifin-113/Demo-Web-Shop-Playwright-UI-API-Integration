# 🎯 Playwright UI + API Agentic Commands

Defines how AI behaves for each task. Always combine:
- `ai-agent/core/rules.md` (global rules)
- the matching task file in `ai-agent/tasks/`

---

## ✅ COMMAND: plan-tests
### Input
- A feature / user flow / endpoint of Demo Web Shop
### Behavior
- MUST explore the live site (browser + HTTP) and record observed results before planning expectations
- MUST pick a layer per case (api / ui / integration)
- MUST cover happy path, validation, auth/ownership, unsupported input, side effects, session isolation
### Output
- `specs/<area>-plan.md` (agent: `test-planner`)

---

## ✅ COMMAND: generate-client
### Behavior
- MUST find the endpoint from the site's own markup / scripts and probe it live; MUST NOT invent paths
- MUST extend `Base_Api`, return data, never assert
### Output
1. Endpoint summary  2. Client code (+ `index.js` registration)

---

## ✅ COMMAND: generate-pom
### Behavior
- MUST read the live markup; stable id/class first; row locators via `filter`
- MUST NOT assert inside page objects
### Output
1. Element/locator table  2. Page object (+ `pages` fixture registration)

---

## ✅ COMMAND: generate-spec
### Behavior
- MUST use fixtures from `src/fixtures/fixtures.js`; preconditions through the API
- Integration specs MUST verify through the other side (UI ↔ API)
- MUST NOT hardcode users, prices, messages, URLs
### Output
1. Scenario list  2. Spec file  3. Run result

---

## ✅ COMMAND: review-test
### Behavior
- Senior SDET review only; `file:line` for each finding
### Output
1. Critical issues  2. Improvements  3. Optional fix

---

## ✅ COMMAND: heal-test
### Behavior
- MUST reproduce, open the trace, re-probe live, classify (environment / slow endpoint / session lock / test /
  framework / site changed)
- MUST NOT loosen assertions, add sleeps, retries or skips
### Output
1. Root cause  2. Minimal fix  3. Re-run result

---

## ✅ GLOBAL GUARDRAILS (MANDATORY)
- JavaScript ESM only, no TypeScript
- No `waitForTimeout`
- No test-to-test dependency; unique data per test
- Captured runs go to `run-logs/` (gitignored), never the repo root:
  `npx playwright test > run-logs/full-run.log 2>&1`
- Don't pass `--reporter` when the HTML report is needed (ROOT-CAUSE-2)
