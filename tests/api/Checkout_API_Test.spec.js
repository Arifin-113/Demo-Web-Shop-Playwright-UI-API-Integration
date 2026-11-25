import { test, expect } from '../../src/fixtures/fixtures.js';
import { createApiClients } from '../../src/api/index.js';
import { SHIPPING, PAYMENT } from '../../src/api/Checkout_Api.js';
import { PRODUCTS, CHECKOUT_FEES } from '../../src/data/products.js';
import { buildAddress, buildUser, MESSAGES } from '../../src/data/users.js';

const { computingBook } = PRODUCTS;

test.describe('Checkout + order API', () => {
  test('one-page checkout step by step creates an order', { tag: '@smoke' }, async ({ api, apiUser }) => {
    test.info().annotations.push({
      type: 'known-issue',
      description: 'DEFECT-2: this order is placed without ever accepting the terms of service; the server does not check it',
    });
    const quantity = 2;
    let addressId;

    await test.step('precondition: address + cart through the API', async () => {
      await api.address.add(buildAddress(apiUser));
      [{ id: addressId }] = await api.address.list();
      await api.cart.addFromDetails(computingBook.id, quantity);
    });

    await test.step('every OPC step answers with the next section', async () => {
      const start = await api.checkout.start();
      expect(start.status()).toBe(200);
      const expectedFlow = [
        [() => api.checkout.saveBilling(addressId), 'shipping'],
        [() => api.checkout.saveShipping(addressId), 'shipping-method'],
        [() => api.checkout.saveShippingMethod(SHIPPING.ground), 'payment-method'],
        [() => api.checkout.savePaymentMethod(PAYMENT.cashOnDelivery), 'payment-info'],
        [() => api.checkout.savePaymentInfo(), 'confirm-order'],
      ];
      for (const [callStep, nextSection] of expectedFlow) {
        const { response, body } = await callStep();
        expect(response.status()).toBe(200);
        expect(body.error, `no error before ${nextSection}`).toBeUndefined();
        expect(body.update_section.name).toBe(nextSection);
      }
      const { body } = await api.checkout.confirmOrder();
      expect(body).toEqual({ success: 1 });
    });

    const orderNumber = await test.step('completed page shows an order number', async () => {
      const number = await api.checkout.getCompletedOrderNumber();
      expect(number).toMatch(/^\d+$/);
      return number;
    });

    await test.step('order history and details match the cart', async () => {
      expect(await api.orders.listOrderNumbers()).toContain(orderNumber);
      const order = await api.orders.getOrderDetails(orderNumber);
      expect(order.orderNumber).toBe(orderNumber);
      expect(order.status).toBe('Pending');
      expect(order.items).toEqual([
        { name: computingBook.name, price: computingBook.price, quantity, total: computingBook.price * quantity },
      ]);
      expect(order.total).toBe(computingBook.price * quantity + CHECKOUT_FEES.groundShipping + CHECKOUT_FEES.cashOnDelivery);
    });

    await test.step('the cart is empty after the order', async () => {
      expect((await api.cart.getCart()).items).toEqual([]);
    });
  });

  test('confirming with an empty cart is rejected', async ({ api, apiUser: _registered }) => {
    const { response, body } = await api.checkout.confirmOrder();
    expect(response.status()).toBe(200);
    expect(body).toEqual({ error: 1, message: MESSAGES.checkoutCartEmpty });
  });

  test('an unknown shipping method is rejected', async ({ api, apiUser }) => {
    await api.address.add(buildAddress(apiUser));
    const [{ id: addressId }] = await api.address.list();
    await api.cart.addFromCatalog(computingBook.id);
    await api.checkout.start();
    await api.checkout.saveBilling(addressId);
    await api.checkout.saveShipping(addressId);

    const { body } = await api.checkout.saveShippingMethod('Teleport___Shipping.FixedRate');
    expect(body.error).toBe(1);
    expect(body.message).toContain("Selected shipping method can't be loaded");
  });

  test("a customer cannot open another customer's order", async ({ api, apiUser, playwright, baseURL }) => {
    await api.address.add(buildAddress(apiUser));
    const [{ id: addressId }] = await api.address.list();
    await api.cart.addFromCatalog(computingBook.id);
    const orderNumber = await api.checkout.placeOrder(addressId);

    const otherContext = await playwright.request.newContext({ baseURL });
    try {
      const otherCustomer = createApiClients(otherContext);
      await otherCustomer.auth.register(buildUser());
      const response = await otherCustomer.orders.getOrderDetailsResponse(orderNumber);
      expect(response.status()).toBe(302);
      expect(response.headers()['location']).toContain('/login');
    } finally {
      await otherContext.dispose();
    }
  });
});
