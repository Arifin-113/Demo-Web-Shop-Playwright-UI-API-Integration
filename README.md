# Demo Web Shop: Playwright UI + API Integration Automation

End-to-end automation for **[Tricentis Demo Web Shop](https://demowebshop.tricentis.com/)**, a public practice
shop built on nopCommerce. The suite is written in JavaScript (ES Modules) with Playwright Test and covers:

- **API tests** that call the shop's HTTP endpoints through Playwright's `APIRequestContext`
- **UI tests** that drive the browser through Page Objects
- **UI + API integration tests**, where the browser and the API clients **share one session**. Test data is
  created through the API and checked in the UI, and UI actions are checked against server state through the API.

| Layer | Folder | Tests | Browser |
|---|---|---|---|
| API | `tests/api` | 26 | none (only the `request` fixture) |
| UI | `tests/ui` | 12 | Chromium |
| Integration | `tests/integration` | 13 | Chromium + API |

---

## 1. Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env          # optional: every setting has a default
npm test                      # all three projects
npm run report                # open the newest HTML report
```

Requirements: Node.js ≥ 20.19 and internet access to `demowebshop.tricentis.com`.

## 2. Commands

| Command | What it runs |
|---|---|
| `npm test` | everything (api + ui + integration) |
| `npm run test:api` | API layer only (no browser) |
| `npm run test:ui` | UI layer only |
| `npm run test:integration` | UI + API integration layer only |
| `npm run test:smoke` | tests tagged `@smoke` |
| `npm run test:headed` | ui + integration with a visible browser |
| `npm run test:list` | list every test without running anything |
| `npm run report` | open the newest HTML report |
| `npx playwright test tests/api/Cart_API_Test.spec.js` | one file |
| `npx playwright test -g "checkout"` | tests whose title matches |

## 3. Configuration (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://demowebshop.tricentis.com/` | target site (used by the browser **and** the API) |
| `TEST_USER_PASSWORD` | `Test@12345` | password for every user the tests register |
| `TEST_EMAIL_DOMAIN` | `mailinator.com` | domain for generated e-mails |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `HEADLESS` | `true` | set `false` for a visible browser locally |
| `CI` | unset | `true` → 2 retries, 2 workers, headless, `test.only` forbidden |

All settings are read in one place: `src/config/env.js`.

## 4. Reports and artifacts

- **HTML report:** every run writes a new folder, `playwright-report/Report-<YYYY-MM-DD>_T_<HH-MM-SS>/`, so earlier
  reports are kept. `npm run report` opens the newest one.
- **Evidence for every test**, stored in the report's `data/` folder and attached to each test:
  - a **video** (`.webm`) for every UI and integration test;
  - a **trace** (`.zip`) for every test. API tests have no browser, so their trace is their evidence: every HTTP call
    with its headers and body. Open one with `npx playwright show-trace <trace.zip>`.
  - a **screenshot** when a test fails.
- **Logs:** every API call is logged as `[time] LEVEL [Client] METHOD /path status -> redirect` and appears in the
  console and in each test's *stdout* section of the report.

---

## 5. What the site really exposes (investigation results)

The live site was probed before any code was written. **There is no REST/JSON API**: `/api`, `/api/v1`, `/odata`,
`/swagger` and similar paths all return 404. The site is server-rendered nopCommerce 2.x. What it *does* have:

1. **AJAX endpoints that answer with JSON**, the same ones the site's own JavaScript calls.
2. **Form posts that answer with a redirect (302) or an HTML page**, the same as a browser submitting a form.

The API clients use exactly these endpoints, all of them verified live. None of them are invented.

| Area | Endpoint | Success | Failure |
|---|---|---|---|
| Register | `GET /register` → `POST /register` (anti-forgery token) | 302 → `/registerresult/1` | 200 + validation messages |
| Login | `POST /login` | 302 → `/` | 200 + "Login was unsuccessful…" |
| Logout | `GET /logout` | 302 → `/` | — |
| Account | `GET /customer/info` | 200 | 302 → `/login?ReturnUrl=…` |
| Cart add | `POST /addproducttocart/catalog/{id}/1/{qty}` | JSON `{success:true, updatetopcartsectionhtml:"(n)"}` | `{success:false, message}` / `{redirect}` |
| Cart add (qty) | `POST /addproducttocart/details/{id}/1` | same JSON | same |
| Cart read / update / remove | `GET /cart`, `POST /cart` (multipart) | HTML | — |
| Wishlist | `POST /addproducttocart/details/{id}/2`, `GET/POST /wishlist` | JSON / HTML | `"Wishlist is disabled for this product"` |
| Addresses | `POST /customer/addressadd`, `GET /customer/addresses`, `GET /customer/addressdelete/{id}` | 302 | 200 + field errors |
| Checkout | `GET /onepagecheckout`, `POST /checkout/OpcSave{Billing,Shipping,ShippingMethod,PaymentMethod,PaymentInfo}/`, `POST /checkout/OpcConfirmOrder/` | JSON `{update_section:{name}}` → `{success:1}` | JSON `{error:1, message}` |
| Orders | `GET /checkout/completed/`, `GET /customer/orders`, `GET /orderdetails/{id}` | HTML | another customer's order → 302 `/login` |
| Search / product | `GET /search?q=`, `GET /{product-slug}` | HTML | — |
| Newsletter | `POST /subscribenewsletter` | JSON `{Success:true, Result}` | `{Success:false, Result:"Enter valid email"}` |

**Authentication:** the site uses cookies only. A successful register or login sets the HttpOnly cookie
`NOPCOMMERCE.AUTH`, and guests get a `Nop.customer` cookie that owns their cart. The site issues no bearer or JWT
tokens. The only token is the ASP.NET **anti-forgery token** on `/register`. `Auth_Api.register()` reads it from the
form and posts it back, the same way a browser does.

**Where the API answers in HTML**, the client reads the facts it needs from the HTML (`src/utils/html.js`,
`src/api/cartRows.js`) and returns plain objects such as `{ itemId, name, unitPrice, quantity, subtotal }`. The
tests never see raw HTML.

---

## 6. Docker, Jenkins, CI

```bash
docker build -t demowebshop-tests .
docker run --rm -v "$(pwd)/playwright-report:/usr/src/app/playwright-report" demowebshop-tests
```
- `Dockerfile` uses `mcr.microsoft.com/playwright:v1.64.1-noble`. That tag must match the pinned `@playwright/test`.
- `Pipeline/Jenkinsfile.groovy` runs each layer separately inside that image. A failing layer marks the build
  UNSTABLE, and the HTML report (with videos and traces) is archived.
- `.github/workflows/playwright.yml` runs `npm test` on push and PR and uploads `playwright-report/`.
- `Pipeline/Jenkinsfile.nightly.groovy` is a second job: runs every night at about 02:00 Dhaka time, keeps 14 builds,
  and takes parameters for manual runs (`TEST_LAYER`, `GREP`, `BASE_URL`). Click *Build Now* once after creating
  the job so Jenkins registers the schedule and parameters.
- **Both pipelines explained** block by block (what, why, how, alternatives): `docs/Jenkins-Pipelines-Explained.html`.
- **Questions and answers** from the project hand-over: `docs/Q-and-A.html`.
- **Setting up your own server:** `docs/CICD-Learning-Route-Oracle-Cloud-Docker-Jenkins.html` walks through a free
  Oracle Cloud VM, Docker and Jenkins, ending with this pipeline running on it.

## 7. AI-assisted workflow (Claude Code)

| Where | What |
|---|---|
| `CLAUDE.md` | project guide: conventions, live-verified site facts, findings tables |
| `ai-agent/core/rules.md` | the authoring rules (layers, session bridge, assertions, sync, style) |
| `ai-agent/tasks/` | generate-client, generate-pom, generate-spec, review-test, heal-test |
| `ai-agent/prompts/` | scenario-rollout (end-to-end workflow), doc-rollout + doc-template.html (reports), templates |
| `.claude/agents/` | test-planner, test-generator, test-healer, api-client-writer, pom-writer, spec-writer, test-reviewer |
| `.claude/skills/` | `/automate-scenario`, `/make-doc`, `/make-doc-html` |
| `.mcp.json` | Playwright test MCP server for live browser exploration |
| `docs/` | the full-suite report and the Claude session index |

## 8. Architecture

```
├── playwright.config.js          3 projects (api / ui / integration), timestamped HTML report, artifacts on failure
├── .env.example                  environment template
├── scripts/open-latest-report.js npm run report
├── src/
│   ├── config/env.js             the only place that reads process.env
│   ├── api/                      API clients: one class per area, one method per HTTP call
│   │   ├── Base_Api.js           logging, error wrapping, getHtml(), readJson()
│   │   ├── Auth_Api.js  Catalog_Api.js  Cart_Api.js  Wishlist_Api.js
│   │   ├── Address_Api.js  Checkout_Api.js  Order_Api.js  Newsletter_Api.js
│   │   ├── cartRows.js           shared parser for cart / wishlist rows
│   │   └── index.js              createApiClients(request): all clients on ONE request context
│   ├── pages/                    Page Object Model
│   │   ├── Base_Page.js          navigation, header, AJAX notification bar
│   │   ├── Header_Component.js   composed into every page as `.header`
│   │   └── Register_ / Login_ / Product_ / Search_ / Cart_ / Wishlist_ / Checkout_ / Account_Page.js
│   ├── fixtures/fixtures.js      test.extend: api, pageApi, pages, apiUser, loggedInUser
│   ├── data/                     products.js (live-verified catalogue facts), users.js (unique builders, messages)
│   └── utils/                    logger.js, html.js
└── tests/
    ├── api/          Auth, Cart, Wishlist, Address, Checkout, Catalog
    ├── ui/           Auth, Catalog + Cart
    └── integration/  Auth, Cart + Wishlist, Address, Checkout
```

### The key idea: one session, two drivers

```
                ┌──────────── BrowserContext (one cookie jar) ────────────┐
                │                                                          │
   pages.*  ──► │  page          (UI clicks)                               │
                │                                                          │──► demowebshop.tricentis.com
   pageApi.* ─► │  page.context().request   (HTTP calls, same cookies)     │
                └──────────────────────────────────────────────────────────┘
```

`pageApi` is built on `page.context().request`. That request context **shares cookies with the page** in both
directions, so:

- `loggedInUser` registers a user through the API, and the browser is **already logged in**. No UI login clicks.
- Seed the cart, wishlist or addresses through `pageApi`, then open the page and the UI shows them.
- Click in the UI, then `pageApi.cart.getCart()` reads the **server's** cart for that same session.

`api` is built on the standalone `request` fixture and has no browser. The API layer uses it, and so do UI tests
that only need a user to exist (for example "log in with an existing user").

### Fixtures

| Fixture | Built on | Gives the test |
|---|---|---|
| `api` | `request` | all API clients, standalone session |
| `pageApi` | `page.context().request` | all API clients, **sharing the browser's session** |
| `pages` | `page` | every page object |
| `apiUser` | `api` | a brand-new registered user (logged in on `api`); teardown afterwards |
| `loggedInUser` | `pageApi` | a brand-new user, **browser already logged in**; teardown afterwards |

**Setup** goes through the API only (registering takes 2 requests). **Teardown** empties the cart, empties the
wishlist and deletes addresses. A teardown failure is logged as a warning and never hides the real test result.

### Design rules followed

- API clients **return responses / parsed data and do not assert**. Tests decide what is expected. A 302 counts as
  success for a form post, and a 200 with `{error:1}` counts as failure for checkout.
- Page objects hold locators and user actions. **Assertions live in the specs.**
- Synchronisation uses Playwright auto-waiting and web-first assertions (`toHaveText`, `toHaveURL`, `expect.poll`).
  There are no fixed sleeps.
- Every test creates its own uniquely named user and data, and nothing depends on test order. That allows
  `fullyParallel: true` and repeated runs.
- Preconditions that are not under test (user, address, cart, even a whole order) go through the API, not UI clicks.
- Catalogue facts in `src/data/products.js` were verified on the live site, and messages are copied from live pages.

## 9. Test inventory

**API (`tests/api`)**
- Auth: register (302 + HttpOnly auth cookie + account readable) · duplicate e-mail · password mismatch ·
  login + logout · wrong password · unknown e-mail · anonymous redirect to login
- Cart: catalog add JSON contract · quantity add accumulates · update + remove · attribute product → redirect ·
  unknown product id · carts isolated per session
- Wishlist: add / read / remove · wishlist-disabled product rejected
- Address: create → list → delete · missing city rejected
- Checkout: every one-page-checkout step returns the next section → order → history + details + total + empty cart
  · empty-cart confirm rejected · unknown shipping method rejected · another customer's order is not accessible
- Catalog: search hit / miss · product name + price · newsletter valid / invalid

**UI (`tests/ui`)**
- Register (positive) · field validation · duplicate e-mail (user created through the API) · login / logout ·
  wrong password
- Search hit / miss · product page · add to cart from product page · update quantity + remove from cart ·
  terms-of-service checkbox blocks checkout · wishlist button

**Integration (`tests/integration`)**
- API-registered user is logged in in the UI · UI-registered user can log in through a separate API session ·
  UI login and logout are reflected in the API session · API logout logs the browser out
- API-seeded cart is shown in the UI · UI add / update / remove are verified on the server through the API ·
  guest (anonymous) cart is shared too · API-seeded wishlist → UI "add to cart" → API verifies cart and wishlist
- API-created address is shown in the UI · UI-created address is verified through the API · UI validation error
  → API confirms nothing was saved
- **Full checkout:** API prepares address + cart → UI checkout → UI order number → API verifies order lines,
  total, status and empty cart · API places a whole order → UI order history + details show it

---

## 10. Limitations and live-site findings

Canonical IDs (also in `CLAUDE.md`): **DEFECT-1** = row 3, **DEFECT-2** = row 5 (both annotated as
`known-issue` in the tests that show them). **ROOT-CAUSE-1** = row 4, **ROOT-CAUSE-2** = a `--reporter` flag on the
command line replaces the configured reporters (no HTML report), **ROOT-CAUSE-3** = row 2, **ROOT-CAUSE-4** = API
error logs are cut to the first line so session cookies are never printed.

| # | Finding | How the framework handles it |
|---|---|---|
| 1 | **No REST API.** Only AJAX JSON endpoints and form posts exist. | The API clients use those real endpoints and read HTML where no JSON exists (§5). |
| 2 | **Users and orders cannot be deleted** through any customer-facing endpoint. | Every test registers a new user with a unique e-mail, so tests never depend on earlier data. Accounts and orders stay on the public demo server. |
| 3 | **`GET /customer/addressdelete/{id}` does not answer within 60 s.** The address *is* deleted on the server, but while the request runs, every other request of that session waits (ASP.NET per-session lock). | `Address_Api.delete()` sends the request with an 8 s timeout and treats a timeout as "sent". The test confirms the result with `expect.poll` on the address list. The UI delete button is not automated for the same reason. In teardown, address deletion runs last. |
| 4 | **Address writes are slow:** 20–30 s per `POST /customer/addressadd` at the time of writing. | Address calls get a 60 s timeout, and the test timeout is 3 min. |
| 5 | The terms-of-service checkbox is checked **only in the browser**. The checkout endpoints accept an order without it. | The UI test covers the browser rule. The API checkout simply calls the same endpoints the page calls after the checkbox. |
| 6 | Many products reject the wishlist ("Wishlist is disabled for this product"), and configurable products cannot be quick-added. | Tests use products verified to work (`src/data/products.js`). Both rejections are covered as negative tests. |
| 7 | The site is **shared and public**. Response times vary, and other people's data exists. | Low worker count (4 local / 2 CI), retries on CI, and no test relies on data it did not create. |
| 8 | No real payment gateway exists. | Checkout uses *Cash On Delivery* (+7.00 fee) and *Ground* shipping (0.00). |
