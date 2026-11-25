# Doc rollout: turn a finished automation run into a report

Standing instructions for `/make-doc` (writes `.md` + `.html`) and `/make-doc-html` (writes `.html` only).
This file is the single source of truth; the skills stay thin and read it every time.

Also obey `CLAUDE.md` (auto-loaded), especially **"Documenting findings — ID format"** and the canonical
`DEFECT-n` / `ROOT-CAUSE-n` tables, which this file expands rather than replaces.

---

## Fill in

```
FEATURE:  <Auth | Cart | Checkout | Address | FullSuite | …>
LAYERS:   <api | ui | integration (one or more)>
SPECS:    <tests/<layer>/<Area>_<Layer>_Test.spec.js (one or more)>
CASES:    <the test titles, or the plan section, e.g. specs/checkout-plan.md §2>
RUN:      <the exact command that went green>
MONTH:    <YYYY-MM, defaults to today>
```

Anything omitted is **inferred from the session**. Ask only if `FEATURE` is genuinely ambiguous.

## Output files

| Skill | Writes |
|---|---|
| `/make-doc` | `docs/<Feature>-Test-Automation-<MONTH>.md` **and** `.html` |
| `/make-doc-html` | `docs/<Feature>-Test-Automation-<MONTH>.html` only |

`<Feature>` is PascalCase with no spaces. Updating a report for the same feature and month? **Edit it in place.**
Never create a `-v2`.

### Division of labour between the two formats
- **`.md` = the plain audit trail.** What was automated, what the run proved, what was found.
- **`.html` = the same content PLUS the teaching walkthrough.** Self-contained (inline CSS, no external assets).

### The HTML template: owner-approved, use it every time
**`ai-agent/prompts/doc-template.html`** is the reference design (same `<style>` block as the Restful Booker and
earlier reports). Copy it and fill it in. Don't invent a new palette or layout. Preserve: the gradient header with
the `claude --resume <session-id>` line and `.kpi` cards; the dark-mode block (light **and** dark must be readable);
`.tablewrap` around every table; `.tag.auto / .plan / .both / .rc`; `.note`, `.ok-note`, `.bad-note`; `.rccard`;
`<dl class="why">`; dark `<pre><code>` blocks with `<`, `>` and `&` escaped.

### Evidence from the run (this repo records it for every test)
`playwright.config.js` keeps `video: 'on'` and `trace: 'on'`, so the run's HTML report folder
(`playwright-report/Report-<date>_T_<time>/`) has a `data/` folder with one `.webm` per browser test and one trace
`.zip` per test. In the report:
- name the report folder and give the counts (videos, traces);
- for each integration case, cite what the trace shows (the API call + response that proved server state);
- never embed the videos (keep the HTML self-contained); link the relative path instead.

### The teaching sections: framework FIRST, then the specs
- **§8 the framework**, opening with a **glossary** (APIRequestContext, BrowserContext, cookie jar, fixture,
  page object, web-first assertion, `expect.poll`, anti-forgery token, 302 redirect, AJAX section, trace), then
  **JavaScript patterns** (Way-1 / Way-2), then each layer in dependency order: `env.js` → `playwright.config.js`
  (projects, reporters, evidence) → `Base_Api` + the clients used → `Base_Page` / `Header_Component` + the pages
  used → `fixtures.js` (**the session bridge: `page.context().request`**, setup + teardown) → `products.js` /
  `users.js` → `html.js` / `logger.js`.
- **§9 the specs**, layer by layer: a scope map (imports → `describe` → `test` → `test.step`), then each test:
  preconditions (API) / action / verification, and *why* the verification goes through the other side.

### Every function and every test: a toddler explanation + "When to use what · how · why"
For each client method, page action, fixture and non-trivial test: plain purpose + **called by** (grep) → code
verbatim with line range → `<dl class="why">` → **"The very simple version"** (an everyday analogy: `pageApi` is
*a second hand on the same shopping trolley*; a fixture is *a hotel housekeeper*; a page object is *a TV remote*)
with a word-by-word table and real values from the run → a green **"When to use what · how · why"** box.

### Teach every construct Way-1 / Way-2
Way 1 without the technique, Way 2 what the file uses, a `.tiny` neutral example proving both are equivalent, a
**Approach | Example | Best when** table, and the tie-back to the real call site. Cover at minimum: `class` /
`extends` / `super` · `async`/`await` · ESM `import`/`export` · template literals · destructuring in fixture
parameters · `?.` and `??` · arrow functions in `map`/`filter` · `try`/`catch` with `{ cause }` · regex `match` /
`matchAll` capture groups · `Promise.all` (`deleteAll`) · `test.extend` fixtures and `use()`.

### Complete code reference (mandatory, last section)
Every file the run executes, every test and `test.step`, code verbatim **read from the file at generation time**,
with file + line range, callers and a `<dl class="why">`. End with an inventory table; grep for `test(`,
`test.step(`, `async ` methods and confirm each hit is listed.

---

## Required sections
1. **Scope**: layers, areas, every test title and count; what's deliberately not covered and why.
2. **How to run**: the exact green command, env vars, runtime, report folder.
3. **Suite structure, and why**: projects ↔ folders, fixtures, the session bridge, parallel safety.
4. **Evidence per case**: `Expected` (what a correct shop does) vs `Actual (live)` (status / JSON / UI text seen).
5. **Findings**: `DEFECT-n`, `ROOT-CAUSE-n`, `OPEN-QUESTION-n` (canonical numbers from `CLAUDE.md`).
6. **Corrections log**: what was wrong during the work, kept on the record.
7. **Open follow-ups** (`FU-n`).
8. **Code walkthrough (1 of 2): the framework**
9. **Code walkthrough (2 of 2): the specs**
10. **Complete code reference**

## Finding IDs: fully spelled, never abbreviated
`DEFECT-n` (product) · `ROOT-CAUSE-n` (automation side) · `OPEN-QUESTION-n` (not concluded, never reported).
Every `DEFECT-n` has Expected / Actual / Impact and a live reproduction captured in this session. One issue, one ID.
Never pre-allocate. When you can't tell a bug from intended behaviour, **ask** before filing. A label lives in the
`.md`, `.html`, `CLAUDE.md`, `README.md` and the test annotation; reclassifying updates all of them.

## Corrections log
Keep the wrong reasoning on the record: assumptions a probe disproved, findings nearly filed that shouldn't have
been, fixes that caused failures.

## Session index
Add a row to **`docs/Claude-Session-Index.html`** (feature, date, files touched, outcome) plus any `FU-n`.
Create it from the template if it doesn't exist.

---

## Non-negotiable
- **Only real values** from a run or probe you actually read.
- **Report the run honestly.** Skipped, flaky or unproven gets written down.
- **Don't touch specs, clients, page objects or utils** while documenting. Report code problems and ask.
- **Write for someone outside the team.**
