import { test, expect } from '../../src/fixtures/fixtures.js';
import { PRODUCTS } from '../../src/data/products.js';
import { uniqueEmail, MESSAGES } from '../../src/data/users.js';

const { laptop, smartphone } = PRODUCTS;

test.describe('Catalog + newsletter API', () => {
  test('search finds a product by name', async ({ api }) => {
    expect(await api.catalog.search('laptop')).toContain(laptop.name);
  });

  test('search with no match returns an empty grid', async ({ api }) => {
    expect(await api.catalog.search('zzqqxx-no-such-product')).toEqual([]);
  });

  test('product pages expose the expected name and price', async ({ api }) => {
    for (const product of [laptop, smartphone]) {
      expect(await api.catalog.getProduct(product)).toEqual({ name: product.name, price: product.price });
    }
  });

  test('newsletter subscription accepts a valid e-mail', async ({ api }) => {
    const { response, body } = await api.newsletter.subscribe(uniqueEmail('news'));
    expect(response.status()).toBe(200);
    expect(body.Success).toBe(true);
    expect(body.Result).toContain(MESSAGES.newsletterThanks);
  });

  test('newsletter subscription rejects an invalid e-mail', async ({ api }) => {
    const { body } = await api.newsletter.subscribe('not-an-email');
    expect(body).toEqual({ Success: false, Result: MESSAGES.newsletterInvalid });
  });
});
