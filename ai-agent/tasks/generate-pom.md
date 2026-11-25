TASK:
Add or extend a page object in `src/pages/`.

────────────────────────────────────

BEFORE CODING (mandatory):

1. Open the page live (Playwright MCP from `.mcp.json`, or `npx playwright codegen https://demowebshop.tricentis.com/<path>`)
   and read the real markup of every element you will touch.
2. Note which parts are loaded by AJAX (one-page-checkout sections, notification bar, header counters) since
   those need a wait on the *next* element, not a sleep.
3. Grep `src/pages/` first: extend an existing page object before creating a new one.

────────────────────────────────────

RULES:

- `export class <Name>_Page extends Base_Page`; `super(page)` gives `this.page`, `this.header`,
  `this.notificationBar`, `this.pageTitle`, `open(path)`, `readNotification()`.
- Locators are constructor fields; product- or row-specific locators are methods:
  `row(productName)` → `this.rows.filter({ has: this.page.locator('a.product-name', { hasText: productName }) })`.
- Locator priority: stable `id` (`#checkout`, `#Address_City`) → stable class / attribute → `getByLabel` / role.
  Never positional `nth()` on lists whose order can change.
- Actions are verbs that a user does (`addToCart`, `setQuantity`, `proceedToCheckout`), and composite flows are
  allowed when they are one user intent (`completeWithSavedAddress`).
- **No assertions.** Return values for the spec to assert (`readOrderNumber()`, `productNames()`).
- Add the new page to the `pages` fixture in `src/fixtures/fixtures.js`.

────────────────────────────────────

OUTPUT:
1. Element table: element | locator | why this locator
2. The page object code (+ fixture registration)
3. A spec run that uses it
