import { test, expect } from '../../src/fixtures/fixtures.js';
import { PRODUCTS } from '../../src/data/products.js';
import { MESSAGES } from '../../src/data/users.js';

const { smartphone, healthBook, laptop } = PRODUCTS;

test.describe('Wishlist API', () => {
  test('add allowed products, read them back, remove one', async ({ api, apiUser }) => {
    await test.step('POST add-to-wishlist for two allowed products', async () => {
      for (const product of [smartphone, healthBook]) {
        const { body } = await api.wishlist.add(product.id);
        expect(body.success, `${product.name} added`).toBe(true);
      }
    });

    const items = await test.step('GET /wishlist lists both', async () => {
      const wishlist = await api.wishlist.getItems();
      expect(wishlist.map((item) => item.name).sort()).toEqual([healthBook.name, smartphone.name].sort());
      return wishlist;
    });

    await test.step('remove one item', async () => {
      const phone = items.find((item) => item.name === smartphone.name);
      await api.wishlist.removeItem(phone.itemId);
      expect((await api.wishlist.getItems()).map((item) => item.name)).toEqual([healthBook.name]);
    });
  });

  test('a product with the wishlist disabled is rejected', async ({ api }) => {
    const { response, body } = await api.wishlist.add(laptop.id);
    expect(response.status()).toBe(200);
    expect(body.success).toBe(false);
    expect(body.message).toContain(MESSAGES.wishlistDisabled);
    expect(await api.wishlist.getItems()).toEqual([]);
  });
});
