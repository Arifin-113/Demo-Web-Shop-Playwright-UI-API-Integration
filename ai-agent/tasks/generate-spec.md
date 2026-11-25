TASK:
Write a spec for a Demo Web Shop scenario in the correct layer.

────────────────────────────────────

PICK THE LAYER:

| The scenario is about… | Layer | Fixtures |
|---|---|---|
| an endpoint's contract (status, JSON, persisted state) | `tests/api` | `api`, `apiUser` |
| what a user sees and does in the browser | `tests/ui` | `pages` (+ `api`/`apiUser`/`pageApi` for preconditions only) |
| data crossing between UI and server | `tests/integration` | `pages`, `pageApi`, `loggedInUser` |

────────────────────────────────────

CONSTRAINTS:

- ❌ No raw `request.*` / `page.request.*`, URLs or form fields in specs. Use the API clients and page objects.
- ❌ No UI clicks for preconditions that the API can do (register, login, address, cart, wishlist, order).
- ❌ No hardcoded e-mails, passwords, prices or messages: `buildUser`, `buildAddress`, `PRODUCTS`, `CHECKOUT_FEES`, `MESSAGES`.
- ❌ No `waitForTimeout`, no order dependence, no assertions on data the test did not create.
- ✅ Import `test, expect` from `../../src/fixtures/fixtures.js`.
- ✅ Every expected status / message was observed live (probe first).
- ✅ Integration tests verify through the *other* side.
- ✅ Extra sessions via `playwright.request.newContext({ baseURL })`, disposed in `finally`.

────────────────────────────────────

STRUCTURE:

```js
import { test, expect } from '../../src/fixtures/fixtures.js';
import { PRODUCTS } from '../../src/data/products.js';

test.describe('<Area>: <what crosses where>', () => {
  test('<behaviour title>', { tag: '@smoke' }, async ({ pages, pageApi, loggedInUser: _user }) => {
    await test.step('API: <precondition>', async () => { … });
    await test.step('UI: <action>', async () => { … });
    await test.step('API: <server state is …>', async () => { … });
  });
});
```

────────────────────────────────────

COVERAGE CHECKLIST (per area):

- Happy path (status + body / UI state + persisted server state)
- Validation: each required field / wrong format, and proof that nothing was saved
- Auth: anonymous → redirected; another customer → denied
- Not found / unsupported: unknown product id, configurable product, wishlist-disabled product
- Side effects: header counters, totals, cart emptied after order, session ended after logout
- Session isolation: a second context does not see the first one's data

────────────────────────────────────

OUTPUT:
1. Scenario list: title → layer → expected (observed) result
2. The spec file
3. Run result: `npx playwright test <spec> --retries=0`
