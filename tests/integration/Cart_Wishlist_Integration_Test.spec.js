import { test, expect } from '../../src/fixtures/fixtures.js';
import { PRODUCTS } from '../../src/data/products.js';

const { laptop, computingBook, smartphone, healthBook } = PRODUCTS;

test.describe('Cart + wishlist: API <-> UI', () => {
  test('cart seeded through the API is shown in the UI', { tag: '@smoke' }, async ({ pages, pageApi, loggedInUser: _user }) => {
    await test.step('API: add 1 laptop + 3 books', async () => {
      await pageApi.cart.addFromCatalog(laptop.id);
      await pageApi.cart.addFromDetails(computingBook.id, 3);
    });

    const { cart } = pages;
    await test.step('UI: cart rows, quantities, totals and header count match', async () => {
      await cart.open();
      expect((await cart.productNames()).sort()).toEqual([laptop.name, computingBook.name].sort());
      await expect(cart.quantityInput(computingBook.name)).toHaveValue('3');
      await expect(cart.subtotal(laptop.name)).toHaveText(laptop.price.toFixed(2));
      await expect(cart.orderTotal).toHaveText((laptop.price + computingBook.price * 3).toFixed(2));
      await expect(cart.header.cartQuantity).toHaveText('(4)');
    });
  });

  test('UI cart changes are persisted server-side (verified through the API)', async ({ pages, pageApi, loggedInUser: _user }) => {
    const { product, cart } = pages;

    await test.step('UI: add from the product page', async () => {
      await product.open(computingBook);
      await product.addToCart(computingBook, 2);
      await expect(product.header.cartQuantity).toHaveText('(2)');
    });

    await test.step('API: the server cart has the item', async () => {
      const { items } = await pageApi.cart.getCart();
      expect(items).toEqual([expect.objectContaining({ name: computingBook.name, quantity: 2 })]);
    });

    await test.step('UI: change quantity to 5 -> API sees 5', async () => {
      await cart.open();
      await cart.setQuantity(computingBook.name, 5);
      await expect(cart.quantityInput(computingBook.name)).toHaveValue('5');
      const { items, total } = await pageApi.cart.getCart();
      expect(items[0].quantity).toBe(5);
      expect(total).toBe(computingBook.price * 5);
    });

    await test.step('UI: remove -> API cart is empty', async () => {
      await cart.remove(computingBook.name);
      await expect(cart.rows).toHaveCount(0);
      expect((await pageApi.cart.getCart()).items).toEqual([]);
    });
  });

  test('guest cart: API and browser share the anonymous session too', async ({ pages, pageApi }) => {
    await pageApi.cart.addFromCatalog(smartphone.id);
    await pages.cart.open();
    expect(await pages.cart.productNames()).toEqual([smartphone.name]);
    await expect(pages.cart.header.accountLink).toBeHidden();
  });

  test('wishlist seeded through the API -> moved to the cart in the UI -> verified through the API', async ({ pages, pageApi, loggedInUser: _user }) => {
    const { wishlist } = pages;

    await test.step('API: two products on the wishlist', async () => {
      await pageApi.wishlist.add(smartphone.id);
      await pageApi.wishlist.add(healthBook.id);
    });

    await test.step('UI: wishlist shows both', async () => {
      await wishlist.open();
      expect((await wishlist.productNames()).sort()).toEqual([healthBook.name, smartphone.name].sort());
      await expect(wishlist.header.wishlistQuantity).toHaveText('(2)');
    });

    await test.step('UI: move the smartphone to the cart', async () => {
      await wishlist.moveToCart(smartphone.name);
      await expect(wishlist.page).toHaveURL(/\/cart$/);
    });

    await test.step('API: cart has the smartphone, wishlist keeps only the book', async () => {
      const { items } = await pageApi.cart.getCart();
      expect(items.map((item) => item.name)).toEqual([smartphone.name]);
      expect((await pageApi.wishlist.getItems()).map((item) => item.name)).toEqual([healthBook.name]);
    });
  });
});
