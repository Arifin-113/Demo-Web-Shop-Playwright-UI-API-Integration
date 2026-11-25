import { test, expect } from '../../src/fixtures/fixtures.js';
import { createApiClients } from '../../src/api/index.js';
import { PRODUCTS, UNKNOWN_PRODUCT_ID } from '../../src/data/products.js';
import { MESSAGES } from '../../src/data/users.js';

const { laptop, computingBook, cheapComputer } = PRODUCTS;

// A cart belongs to the session cookie, so these run as a fresh guest: `api` is a new context per test.
test.describe('Cart API: add, read, update, remove', () => {
  test('add from catalog returns success JSON and the cart lists the product', { tag: '@smoke' }, async ({ api }) => {
    const { response, body } = await api.cart.addFromCatalog(laptop.id);

    await test.step('200 + success JSON with the new header count', async () => {
      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain('The product has been added to your');
      expect(body.updatetopcartsectionhtml).toBe('(1)');
    });

    await test.step('GET /cart shows the product, its price and the total', async () => {
      const cart = await api.cart.getCart();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toMatchObject({ name: laptop.name, unitPrice: laptop.price, quantity: 1, subtotal: laptop.price });
      expect(cart.total).toBe(laptop.price);
    });
  });

  test('add from details with a quantity; repeated adds accumulate', async ({ api }) => {
    await api.cart.addFromDetails(computingBook.id, 3);
    const { body } = await api.cart.addFromDetails(computingBook.id, 2);
    expect(body.updatetopcartsectionhtml).toBe('(5)');

    const { items } = await api.cart.getCart();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ quantity: 5, subtotal: computingBook.price * 5 });
  });

  test('update quantity and remove an item', async ({ api }) => {
    await api.cart.addFromCatalog(laptop.id);
    await api.cart.addFromCatalog(computingBook.id);
    let { items } = await api.cart.getCart();
    const bookItem = items.find((item) => item.name === computingBook.name);
    const laptopItem = items.find((item) => item.name === laptop.name);

    await test.step('POST /cart with a new quantity', async () => {
      const response = await api.cart.updateQuantities({ [bookItem.itemId]: 4 });
      expect(response.ok()).toBe(true);
      ({ items } = await api.cart.getCart());
      expect(items.find((item) => item.itemId === bookItem.itemId).quantity).toBe(4);
    });

    await test.step('POST /cart with removefromcart', async () => {
      await api.cart.removeItem(laptopItem.itemId);
      const cart = await api.cart.getCart();
      expect(cart.items.map((item) => item.name)).toEqual([computingBook.name]);
      expect(cart.total).toBe(computingBook.price * 4);
    });
  });

  test('a product that needs attributes is not added; the server redirects to its page', async ({ api }) => {
    const { body } = await api.cart.addFromCatalog(cheapComputer.id);
    expect(body.redirect).toBe(`/${cheapComputer.slug}`);
    expect((await api.cart.getCart()).items).toEqual([]);
  });

  test('an unknown product id is rejected', async ({ api }) => {
    const { response, body } = await api.cart.addFromCatalog(UNKNOWN_PRODUCT_ID);
    expect(response.status()).toBe(200);
    expect(body.success).toBe(false);
    expect(body.message).toBe(MESSAGES.productNotFound);
  });

  test('carts are isolated per session', async ({ api, playwright, baseURL }) => {
    await api.cart.addFromCatalog(laptop.id);

    const otherContext = await playwright.request.newContext({ baseURL });
    try {
      const otherSession = createApiClients(otherContext);
      expect((await otherSession.cart.getCart()).items).toEqual([]);
    } finally {
      await otherContext.dispose();
    }
  });
});
