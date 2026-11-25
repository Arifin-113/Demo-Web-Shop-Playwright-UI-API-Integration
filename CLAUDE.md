# Demo Web Shop UI + API Integration Automation — Project Guide

Playwright **UI + API integration** automation for [Tricentis Demo Web Shop](https://demowebshop.tricentis.com/)
(nopCommerce 2.x, a shared public practice site). **JavaScript only, ES modules** (`"type": "module"`): relative
imports need the `.js` extension, and any helper script that uses `require(...)` must be named `.cjs`. No TypeScript.

## Source of truth for authoring rules
Detailed rules live in **`ai-agent/`**. Read them before generating, reviewing or fixing tests:
- `ai-agent/core/rules.md`: layers, the session bridge, spec structure, assertions, code style
- `ai-agent/tasks/generate-client.md`: how API clients (`src/api/*_Api.js`) are written
- `ai-agent/tasks/generate-pom.md`: how page objects (`src/pages/*_Page.js`) are written
- `ai-agent/tasks/generate-spec.md`: how specs are structured, per layer
- `ai-agent/tasks/review-test.md` / `heal-test.md`: review checklist, failure diagnosis
- `ai-agent/prompts/scenario-rollout.md`: end-to-end workflow for automating a scenario
- `ai-agent/prompts/doc-rollout.md`: how a finished run is written up as a `docs/` report

## Claude Code agents & skills
| Agent (`.claude/agents/`) | Use for | Writes files? |
|---|---|---|
| `test-planner` | Explore a feature (live site + HTTP probes) and save a plan to `specs/` | `specs/*.md` only |
| `test-generator` | Turn one plan section into a spec in the right layer, verifying live | yes |
| `test-healer` | Run failing tests, find the root cause, fix or record a finding | yes |
| `api-client-writer` | Add/extend an API client in `src/api/` (probe the endpoint first) | yes |
| `pom-writer` | Add/extend a page object in `src/pages/` | yes |
| `spec-writer` | Write or refactor a spec from a described flow or existing spec | yes |
| `test-reviewer` | Senior SDET review: assertions, isolation, layers, sync, coverage | **no** (read-only) |

| Skill | Does |
|---|---|
| `/automate-scenario` | analyze → probe live → client/POM → spec → review → run → fix, for one scenario |
| `/make-doc` | write the `.md` audit trail **and** the `.html` teaching report in `docs/` |
| `/make-doc-html` | write the `.html` report only |

`.mcp.json` registers Playwright's test MCP server (`playwright run-test-mcp-server`) for live browser exploration.

## Running tests
```
npm test                                   # all three projects (api, ui, integration)
npm run test:api | test:ui | test:integration
npm run test:smoke                         # @smoke only
npx playwright test <path> -g "<title>"    # one test
npx playwright test --list                 # validate imports/parsing, run nothing
npx playwright test <path> > run-logs/<name>.log 2>&1   # capture output (run-logs/ is gitignored)
npm run report                             # newest HTML report (playwright-report/Report-<date>_T_<time>)
```
- **Never pass `--reporter=...` when you need the HTML report.** A CLI reporter replaces the config's reporters, so
  no `Report-*` folder is written (ROOT-CAUSE-2).
- Projects map 1:1 to folders: `api` → `tests/api` (no browser), `ui` → `tests/ui`, `integration` → `tests/integration`.

## Layout
```
src/config/env.js          env: baseURL, userPassword, emailDomain, logLevel, headless, isCI (.env overrides)
src/api/Base_Api.js        fetch wrapper: logging, error wrapping (first line only, no cookie dumps), getHtml, readJson
src/api/*_Api.js           Auth, Catalog, Cart, Wishlist, Address, Checkout, Order, Newsletter
src/api/cartRows.js        cart / wishlist row parser (shared markup)
src/api/index.js           createApiClients(request): every client on ONE request context
src/pages/                 Base_Page (+ Header_Component as .header), Register, Login, Product, Search, Cart,
                           Wishlist, Checkout, Account
src/fixtures/fixtures.js   api, pageApi, pages, apiUser, loggedInUser (+ teardown)
src/data/products.js       live-verified product ids / slugs / prices / wishlist flag, CHECKOUT_FEES
src/data/users.js          buildUser, buildAddress, uniqueEmail, MESSAGES (copied from live pages)
src/utils/                 logger.js (LOG_LEVEL), html.js (token, validation errors, text helpers)
tests/api | tests/ui | tests/integration   <Area>_<Layer>_Test.spec.js
specs/                     test plans written by test-planner
docs/                      generated reports (/make-doc)
```

## Core conventions
- **One import for specs:** `import { test, expect } from '../../src/fixtures/fixtures.js'`. Never import
  `@playwright/test` directly in a spec.
- **The session bridge:** `pageApi` = API clients on `page.context().request`, which shares the cookie jar with the
  page **both ways**. `loggedInUser` registers through `pageApi`, so the browser starts logged in. `api` = the
  standalone `request` fixture (no browser).
- **Preconditions through the API, never the UI** (user, address, cart, wishlist, even a whole order via
  `checkout.placeOrder`). The UI is only driven for the behaviour under test.
- **Verify UI actions through the API** in integration tests (server state, not just what the page shows).
- **API clients return, never assert.** They return `{ response, body }`, `{ response, errors }` or parsed objects.
  Specs assert. Page objects hold locators + actions; specs assert.
- **Status expectations come from live probes.** On this site a form success is **302**, a form failure is **200 +
  validation messages**, and checkout errors are **200 + `{error:1, message}`**.
- **Unique data per test** (`buildUser()`, `buildAddress()`, `uniqueEmail()`); never rely on existing accounts,
  orders or counts. `fullyParallel: true`.
- **Synchronisation:** web-first assertions (`toHaveText`, `toHaveURL`, `toHaveCount`) and `expect.poll` for server
  state. No `waitForTimeout`.
- `test.step` for multi-phase tests; tags in the option: `{ tag: '@smoke' }`.

## Live-verified site facts (keep tests honest)
- **No REST API.** `/api`, `/api/v1`, `/odata`, `/swagger` → 404. The clients use the AJAX JSON endpoints the pages
  call, plus form posts; HTML is parsed where no JSON exists.
- **Auth = cookies.** `NOPCOMMERCE.AUTH` (HttpOnly) after register/login; guests get `Nop.customer` (owns the cart).
  No bearer / JWT. Only `/register` carries an anti-forgery token (`__RequestVerificationToken`).
- Posting `/register` while logged in signs the current user out first.
- Products: Laptop 31 (1590.00, wishlist disabled) · Computing and Internet 13 (10.00, wishlist disabled) ·
  Smartphone 43 (100.00, wishlist OK) · Health Book 22 (10.00, wishlist OK) · Cheap computer 72 (needs attributes →
  catalog add returns `{redirect}`).
- Checkout: Ground shipping 0.00, Cash On Delivery fee **7.00**. Order status after placing: `Pending`.
- `GET /orderdetails/<another customer's order>` → 302 `/login`.

## Known live-site findings
| ID | Case | Actual | Expected | Handling |
|---|---|---|---|---|
| DEFECT-1 | `GET /customer/addressdelete/{id}` | address **is** deleted but no response within 60 s; the session's other requests queue behind it | 302 → `/customer/addresses` promptly | `Address_Api.delete()` 8 s timeout + `tolerateTimeout`; verify with `expect.poll(list)`. UI Delete button not automated. Teardown deletes addresses **last**. |
| DEFECT-2 | Terms of service on checkout | enforced only by browser JS; `OpcConfirmOrder` places the order without it | server-side rule | UI test covers the browser rule; API checkout proves the server accepts it. |

| ID | Root cause (automation side) |
|---|---|
| ROOT-CAUSE-1 | `POST /customer/addressadd` takes 20–30 s → address calls use a 60 s timeout; test timeout is 3 min. |
| ROOT-CAUSE-2 | `--reporter=…` on the CLI replaces config reporters → no HTML report folder. |
| ROOT-CAUSE-3 | Users and orders cannot be deleted by a customer → data accumulates on the public server; unique e-mails keep runs independent. |
| ROOT-CAUSE-4 | Playwright's call log in a request error repeats every header incl. session cookies → `Base_Api` logs the first line only. |

The same list is in `README.md` §10. A new finding: **probe it first**, then add it here, in the README and in the
test (`test.info().annotations.push({ type: 'known-issue', description: 'DEFECT-n …' })`).

## Gotchas
- The site is **shared and public**: response times vary, other people's data exists. Workers: 4 local / 2 CI.
- `actionTimeout` (15 s) also applies to `APIRequestContext` calls made from tests. Slow endpoints pass their own
  `timeout`.
- Cart / wishlist `POST` with `multipart` cannot repeat a key; remove items one request at a time (`Cart_Api.clear`).
- Address list text comes from `<ul class="info">`; the card title repeats the name, so don't parse the whole card.

## Documenting findings — ID format (use this in EVERY `docs/*` report)
| Prefix | Meaning | Who acts |
|---|---|---|
| **`DEFECT-n`** | The live site disagrees with expected behaviour. A product bug. | Send to developers |
| **`ROOT-CAUSE-n`** | Why the *automation* behaves as it does: shared instance, slowness, framework. Not a product bug. | Internal knowledge |
| **`OPEN-QUESTION-n`** | Observed but not yet classified. | **Do not report** until concluded |

Never `DEF-` / `RC-` / `OPEN-`. Every `DEFECT-n` carries Expected / Actual / Impact and a live reproduction. Numbers
in the tables above are canonical; new items take the next number. Fixed / withdrawn items are relabelled in place.

## Maintaining this file
Update this guide when a convention, finding or gotcha changes. Keep the details in `ai-agent/`; this file stays a summary.
