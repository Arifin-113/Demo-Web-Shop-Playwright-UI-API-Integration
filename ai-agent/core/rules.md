# Demo Web Shop UI + API Integration — Core Rules

Mandatory standards for AI-assisted development in this repo. All contributors and AI agents follow them.
The code is **clean, modern JavaScript (ESM)**. It should be readable top to bottom, without clever abstractions.

---

## 1. General principles
- Do not modify or overwrite existing files without a reason tied to the task. Prefer minimal, reversible changes.
- **Never assume site behaviour. Probe it live first** (`curl` or a throwaway `APIRequestContext` script, plus the
  browser for UI) and assert what you saw.
- **Never invent an endpoint.** This site has no REST API. Use only endpoints you saw the site's own pages call
  (see `CLAUDE.md` "Live-verified site facts").
- Never introduce flaky patterns: shared state, order dependence, fixed sleeps, assertions on data you did not create.
- **JavaScript only** (ES modules, `.js` extensions on relative imports). No TypeScript.

## 2. Project context
- Target: `https://demowebshop.tricentis.com/`: nopCommerce 2.x, server-rendered, **shared public** instance.
- Three layers, three Playwright projects:

| Layer | Folder | Project | Drives |
|---|---|---|---|
| API | `tests/api` | `api` | `api` fixture (standalone `request`), no browser |
| UI | `tests/ui` | `ui` | `pages` (page objects); API only for preconditions |
| Integration | `tests/integration` | `integration` | `pages` + `pageApi` sharing ONE session |

- Source layers:

| Layer | Folder | What it holds |
|---|---|---|
| Config | `src/config/env.js` | the only reader of `process.env` |
| API clients | `src/api/*_Api.js` | one class per area, extends `Base_Api`, one method per HTTP call |
| Page objects | `src/pages/*_Page.js` | locators + user actions; `Header_Component` composed as `.header` |
| Fixtures | `src/fixtures/fixtures.js` | `api`, `pageApi`, `pages`, `apiUser`, `loggedInUser` |
| Test data | `src/data/` | `products.js` (live-verified), `users.js` (unique builders + `MESSAGES`) |
| Utils | `src/utils/` | `logger.js`, `html.js` |

## 3. Configuration
- `env` (`src/config/env.js`) is the single source of truth. Never hardcode the host, passwords or e-mail domains.
- `baseURL` is set once in `playwright.config.js`; the browser and every request context use short paths (`/cart`).
- A new `env` key is documented in `.env.example` with its default.

## 4. API clients (`src/api/`)
- File + class: `<Area>_Api` extends `Base_Api`; `constructor(request) { super(request, '<Area>_Api'); }`.
- One `async` method per HTTP call, plainly named (`addFromCatalog`, `saveBilling`). Composite helpers that exist
  only for preconditions are allowed and named for what they achieve (`placeOrder`, `clear`, `deleteAll`).
- Methods return data, **never assert**: `{ response, body }` for JSON endpoints, `{ response, errors }` for form
  posts, parsed plain objects for HTML pages (`getCart()` → `{ items, total }`).
- Form posts use `maxRedirects: 0` so the test can see the real 302 and its `location`.
- HTML parsing lives in `src/utils/html.js` / `src/api/cartRows.js`, never in specs.
- The file header lists every endpoint with its success / failure shape. JSDoc one line per method.
- Slow or non-answering endpoints pass their own `timeout` (and `tolerateTimeout: true` if a timeout is expected).

## 5. Page objects (`src/pages/`)
- `<Name>_Page` extends `Base_Page`. Locators are fields created in the constructor; actions are `async` methods.
- Locator priority: stable `id` → stable class/attribute (`.cart-qty`, `[data-productid]`) → role/label. Scope row
  locators with `filter({ has / hasText })`, never `nth()` on content that can reorder.
- Product-specific locators are methods taking the product (`price(product)`, `addToCart(product, qty)`).
- **No assertions** in page objects. A method may wait for the element it is about to read
  (`readNotification`, `confirm` waiting for the completed title). That is synchronisation, not an assertion.

## 6. Fixtures, setup and teardown
- Specs import `test, expect` **only** from `src/fixtures/fixtures.js`.
- `pageApi` is built on `page.context().request`: same cookies as the page, both directions.
- `apiUser` / `loggedInUser` register a **new** user through the API, and teardown empties cart + wishlist, then
  deletes addresses **last** (DEFECT-1). A teardown error is logged as `warn` and never fails the test.
- Request a fixture only to trigger it: `async ({ pages, loggedInUser: _user }) =>`.

## 7. Spec structure
- File: `tests/<layer>/<Area>_<API|UI|Integration>_Test.spec.js`; one `test.describe` per area.
- Titles describe behaviour (`'UI cart changes are persisted server-side (verified through the API)'`).
- Multi-phase tests use `test.step`: **preconditions (API) → action (UI or API) → verification (UI and/or API)**.
- Integration tests always verify through **the other side**: API-seeded → UI asserts; UI action → API asserts.
- Tags in the option: `{ tag: '@smoke' }` for the main happy path of each area.

## 8. Assertions & synchronisation
- Hard `expect`. Status first, then body / state. For form posts assert the status **and** `location`.
- UI: web-first assertions only (`toHaveText`, `toHaveValue`, `toHaveURL`, `toHaveCount`, `toBeVisible`).
- Server state that changes asynchronously: `expect.poll(() => api.x.list(), { timeout })`.
- Negative tests prove **nothing changed** (address list still empty, session still anonymous, cart unchanged).
- Prices come from `PRODUCTS` / `CHECKOUT_FEES`, messages from `MESSAGES`. Never copy a value seen once on the
  page into an expectation without recording it as a live-verified fact.
- **No `waitForTimeout`, no sleeps.**

## 9. Known findings
- Assert what the site does **today**. Annotate the test:
  `test.info().annotations.push({ type: 'known-issue', description: 'DEFECT-1: …' });`
- A new finding gets the next number in `CLAUDE.md` and `README.md` §10.

## 10. Code style
- `async`/`await` only (no `.then()` chains). `const` by default.
- `try { … } catch (error) { … }` for error handling; wrap with context (`throw new Error('… failed', { cause })`)
  and never swallow an error silently. Log with `createLogger(scope)`, not `console.log`, in `src/`.
- Full words (`response`, `error`, `addressId`); site field names stay as the site spells them
  (`billing_address_id`, `itemquantity<id>`).
- Every `src/` file starts with a header comment: what it is and the endpoints / pages it covers.
- Comment the *why*. **No date stamps** in code or comments.
- No new dependencies without a reason written in the PR.

## 11. Isolation & parallelism
- Every test runs alone and in any order (`fullyParallel: true`). No module-level mutable state.
- Never rely on existing accounts, orders, counts or fixed ids other than the catalogue products in `products.js`.
- Second sessions (another customer, a clean login) are created with `playwright.request.newContext({ baseURL })`
  and **disposed in `finally`**.

## 12. Scope control
- Do only what was asked. Don't refactor unrelated files.
- Don't weaken an assertion to make a test pass. Find the root cause (`ai-agent/tasks/heal-test.md`).
