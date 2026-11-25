import { test, expect } from '../../src/fixtures/fixtures.js';
import { PRODUCTS } from '../../src/data/products.js';
import { MESSAGES } from '../../src/data/users.js';

const { laptop, computingBook, smartphone } = PRODUCTS;

// Guest-shopper flows: no login needed, every test gets a fresh browser context = fresh guest cart.
test.describe('Catalog + cart UI (guest shopper)', () => {
  test('search shows matching products', async ({ pages }) => {
    const { search } = pages;
    await search.open('');
    await search.header.search('laptop');
    await expect(search.productTitles).toContainText([laptop.name]);
  });

  test('search with no match shows the empty-result message', async ({ pages }) => {
    const { search } = pages;
    await search.open('zzqqxx-no-such-product');
    await expect(search.noResults).toHaveText(MESSAGES.noSearchResults);
    await expect(search.productTitles).toHaveCount(0);
  });

  test('product page shows name and price', async ({ pages }) => {
    const { product } = pages;
    await product.open(smartphone);
    await expect(product.name).toHaveText(smartphone.name);
    await expect(product.price(smartphone)).toHaveText(smartphone.price.toFixed(2));
  });

  test('add to cart from the product page updates the header and the cart', { tag: '@smoke' }, async ({ pages }) => {
    const { product, cart } = pages;

    await test.step('add 2 from the product page', async () => {
      await product.open(computingBook);
      await product.addToCart(computingBook, 2);
      expect(await product.readNotification()).toContain(MESSAGES.addedToCart);
      await expect(product.header.cartQuantity).toHaveText('(2)');
    });

    await test.step('cart lists the product with the right subtotal', async () => {
      await cart.open();
      await expect(cart.quantityInput(computingBook.name)).toHaveValue('2');
      await expect(cart.subtotal(computingBook.name)).toHaveText((computingBook.price * 2).toFixed(2));
    });
  });

  test('change quantity and remove items in the cart', async ({ pages }) => {
    const { search, cart } = pages;

    await test.step('add a product from the search grid', async () => {
      await search.open('laptop');
      await search.addToCartFromGrid(laptop);
      await expect(search.header.cartQuantity).toHaveText('(1)');
    });

    await test.step('update quantity to 3', async () => {
      await cart.open();
      await cart.setQuantity(laptop.name, 3);
      await expect(cart.subtotal(laptop.name)).toHaveText((laptop.price * 3).toFixed(2));
      await expect(cart.orderTotal).toHaveText((laptop.price * 3).toFixed(2));
    });

    await test.step('remove it: the cart is empty', async () => {
      await cart.remove(laptop.name);
      await expect(cart.emptyMessage).toContainText(MESSAGES.cartEmpty);
      await expect(cart.header.cartQuantity).toHaveText('(0)');
    });
  });

  test('checkout without accepting the terms of service is blocked', async ({ pages, pageApi }) => {
    test.info().annotations.push({
      type: 'known-issue',
      description: 'DEFECT-2: the terms rule is browser-only; the checkout endpoints accept an order without it',
    });
    const { cart } = pages;
    await pageApi.cart.addFromCatalog(computingBook.id); // precondition through the API
    await cart.open();
    await cart.checkoutButton.click();
    await expect(cart.termsWarning).toBeVisible();
    await expect(cart.page).toHaveURL(/\/cart$/);
  });

  test('a wishlist-enabled product can be wished for; a disabled one has no wishlist button', async ({ pages }) => {
    const { product } = pages;

    await test.step('enabled product: add to wishlist from the product page', async () => {
      await product.open(smartphone);
      await product.addToWishlist(smartphone);
      await expect(product.header.wishlistQuantity).toHaveText('(1)');
    });

    await test.step('disabled product: the button is not rendered (the API rejects it too, see Wishlist_API_Test)', async () => {
      await product.open(laptop);
      await expect(product.page.locator(`#add-to-wishlist-button-${laptop.id}`)).toHaveCount(0);
    });
  });
});
