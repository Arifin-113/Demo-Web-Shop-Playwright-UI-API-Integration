# Copy-paste templates

## API client method (`src/api/<Area>_Api.js`)
```js
/** POST /path: what it does. Returns { response, body }. */
async doThing(productId, quantity = 1) {
  const response = await this.post(`/path/${productId}`, {
    form: { [`field_${productId}`]: String(quantity) },
  });
  return { response, body: await this.readJson(response) };
}
```

## Form-post method (302 = success, 200 + errors = failure)
```js
async submitThing(data) {
  const response = await this.post('/form-path', { form: { Field: data.field }, maxRedirects: 0 });
  let errors = [];
  if (response.status() === 200) {
    errors = extractValidationErrors(await response.text());
  }
  return { response, errors };
}
```

## Page object
```js
import { Base_Page } from './Base_Page.js';

/** Thing_Page: /thing */
export class Thing_Page extends Base_Page {
  constructor(page) {
    super(page);
    this.rows = page.locator('table.thing tr.item');
    this.saveButton = page.locator('#save-thing');
  }

  async open() {
    await super.open('/thing');
  }

  row(name) {
    return this.rows.filter({ hasText: name });
  }
}
```

## Integration spec
```js
import { test, expect } from '../../src/fixtures/fixtures.js';
import { PRODUCTS } from '../../src/data/products.js';

test.describe('Thing: API <-> UI', () => {
  test('API-seeded thing is shown in the UI', { tag: '@smoke' }, async ({ pages, pageApi, loggedInUser: _user }) => {
    await test.step('API: seed', async () => {
      await pageApi.cart.addFromCatalog(PRODUCTS.laptop.id);
    });

    await test.step('UI: shows it', async () => {
      await pages.cart.open();
      await expect(pages.cart.row(PRODUCTS.laptop.name)).toHaveCount(1);
    });
  });

  test('UI change is persisted server-side', async ({ pages, pageApi, loggedInUser: _user }) => {
    await test.step('UI: act', async () => { /* … */ });
    await test.step('API: verify', async () => {
      await expect.poll(async () => (await pageApi.cart.getCart()).items.length).toBe(1);
    });
  });
});
```

## Second session (another customer / clean login)
```js
test('…', async ({ api, playwright, baseURL }) => {
  const otherContext = await playwright.request.newContext({ baseURL });
  try {
    const otherCustomer = createApiClients(otherContext);
    // …
  } finally {
    await otherContext.dispose();
  }
});
```

## Known-finding annotation
```js
test.info().annotations.push({ type: 'known-issue', description: 'DEFECT-1: addressdelete deletes but never answers' });
```
