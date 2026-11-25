TASK:
Add or extend an API client in `src/api/` for a Demo Web Shop endpoint.

────────────────────────────────────

BEFORE CODING (mandatory):

1. **Find the endpoint the site really uses.** Open the page in a browser (or fetch its HTML) and look for the form
   `action`, the `AjaxCart.*` / `url:` call, or the `*.init('…')` URL. Never guess a path.
2. **Probe it live** with a throwaway script (scratchpad, not the repo) on a fresh `APIRequestContext`:
   ```js
   import { request } from '@playwright/test';
   const context = await request.newContext({ baseURL: 'https://demowebshop.tricentis.com' });
   const response = await context.post('/path', { form: { … }, maxRedirects: 0 });
   console.log(response.status(), response.headers().location, (await response.text()).slice(0, 300));
   ```
   Record: success status (+ `location`), success body shape, failure status + body / validation text, timing.
3. Grep `src/api/` first: extend an existing `<Area>_Api.js` before creating a new one.

────────────────────────────────────

RULES:

- `export class <Area>_Api extends Base_Api` · `constructor(request) { super(request, '<Area>_Api'); }`
- Use `this.get / this.post / this.getHtml / this.readJson` from `Base_Api`, never `this.request` directly.
- `form:` for urlencoded posts, `multipart:` where the page posts `multipart/form-data` (`/cart`).
- `maxRedirects: 0` on form posts. Return `{ response, errors }` (`extractValidationErrors`) or `{ response, body }`.
- Pages without JSON: parse into plain objects with helpers from `src/utils/html.js`; add a shared parser file only
  when two clients need it (`cartRows.js`).
- **No `expect`**. Throw only when the call cannot proceed (missing anti-forgery token, page not loadable).
- Slow endpoint → own `timeout` constant with a comment saying what was measured.
- Header comment: endpoint table (verb, path, success, failure). Register the client in `src/api/index.js`.

────────────────────────────────────

OUTPUT:
1. Endpoint summary: verb | path | auth (cookie / anonymous) | payload | success | failure (observed)
2. The code changes
3. `npx playwright test --list` + a run of a spec that uses the new method
