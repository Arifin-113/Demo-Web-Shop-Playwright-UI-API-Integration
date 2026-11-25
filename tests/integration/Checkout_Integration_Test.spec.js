import { test, expect } from '../../src/fixtures/fixtures.js';
import { PRODUCTS, CHECKOUT_FEES } from '../../src/data/products.js';
import { buildAddress, MESSAGES } from '../../src/data/users.js';

const { computingBook, smartphone } = PRODUCTS;

/** Preconditions through the API: a saved address and a cart. Returns the address id. */
async function prepareAddressAndCart(pageApi, user, cartLines) {
  await pageApi.address.add(buildAddress(user));
  const [address] = await pageApi.address.list();
  for (const { product, quantity } of cartLines) {
    await pageApi.cart.addFromDetails(product.id, quantity);
  }
  return address.id;
}

test.describe('Checkout + orders: API <-> UI', () => {
  test('UI checkout with API-prepared data creates the order the API reads back', { tag: '@smoke' }, async ({ pages, pageApi, loggedInUser }) => {
    const lines = [
      { product: computingBook, quantity: 2 },
      { product: smartphone, quantity: 1 },
    ];
    const itemsTotal = computingBook.price * 2 + smartphone.price;
    const expectedTotal = itemsTotal + CHECKOUT_FEES.groundShipping + CHECKOUT_FEES.cashOnDelivery;

    await test.step('API: saved address + cart (no UI clicks for preconditions)', async () => {
      await prepareAddressAndCart(pageApi, loggedInUser, lines);
    });

    const { cart, checkout } = pages;
    const orderNumber = await test.step('UI: cart -> accept terms -> one-page checkout -> confirm', async () => {
      await cart.open();
      await expect(cart.orderTotal).toHaveText(itemsTotal.toFixed(2));
      await cart.proceedToCheckout();
      await expect(checkout.page).toHaveURL(/\/onepagecheckout$/);
      await checkout.completeWithSavedAddress({ paymentLabel: 'Cash On Delivery' });
      await expect(checkout.confirmOrderTotal).toHaveText(expectedTotal.toFixed(2));
      await checkout.confirm();
      await expect(checkout.completedTitle).toHaveText(MESSAGES.orderProcessed);
      return await checkout.readOrderNumber();
    });

    await test.step('API: order exists with the right lines, total and status', async () => {
      expect(await pageApi.orders.listOrderNumbers()).toContain(orderNumber);
      const order = await pageApi.orders.getOrderDetails(orderNumber);
      expect(order.status).toBe('Pending');
      expect(order.total).toBe(expectedTotal);
      expect(order.items).toEqual(
        expect.arrayContaining([
          { name: computingBook.name, price: computingBook.price, quantity: 2, total: computingBook.price * 2 },
          { name: smartphone.name, price: smartphone.price, quantity: 1, total: smartphone.price },
        ]),
      );
    });

    await test.step('API: the cart was emptied by the order', async () => {
      expect((await pageApi.cart.getCart()).items).toEqual([]);
    });
  });

  test('order placed through the API is shown in the UI order history and details', async ({ pages, pageApi, loggedInUser }) => {
    const addressId = await prepareAddressAndCart(pageApi, loggedInUser, [{ product: computingBook, quantity: 3 }]);
    const orderNumber = await pageApi.checkout.placeOrder(addressId);
    const expectedTotal = (computingBook.price * 3 + CHECKOUT_FEES.cashOnDelivery).toFixed(2);

    const { account } = pages;
    await test.step('UI: order history lists the order', async () => {
      await account.openOrders();
      const item = account.orderItem(orderNumber);
      await expect(item).toHaveCount(1);
      await expect(item).toContainText('Order status: Pending');
      await expect(item).toContainText(`Order Total: ${expectedTotal}`);
    });

    await test.step('UI: order details page', async () => {
      await account.openOrderDetails(orderNumber);
      await expect(account.orderDetailsNumber).toHaveText(`Order #${orderNumber}`);
      await expect(account.orderDetailsStatus).toContainText('Order Status: Pending');
      await expect(account.orderDetailsTotal).toHaveText(expectedTotal);
      await expect(account.orderDetailsProducts).toHaveText([computingBook.name]);
    });
  });
});
