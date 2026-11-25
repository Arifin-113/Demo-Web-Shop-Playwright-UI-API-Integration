import { Base_Api } from './Base_Api.js';
import { matchFirst } from '../utils/html.js';

/**
 * Checkout_Api: the one-page-checkout AJAX endpoints (the same ones the browser calls).
 *
 *   GET  /onepagecheckout                   opened first (starts the checkout)
 *   POST /checkout/OpcSaveBilling/          billing_address_id   -> update_section.name 'shipping'
 *   POST /checkout/OpcSaveShipping/         shipping_address_id  -> 'shipping-method'
 *   POST /checkout/OpcSaveShippingMethod/   shippingoption       -> 'payment-method'
 *   POST /checkout/OpcSavePaymentMethod/    paymentmethod        -> 'payment-info'
 *   POST /checkout/OpcSavePaymentInfo/      (no fields for COD)  -> 'confirm-order'
 *   POST /checkout/OpcConfirmOrder/         -> {success:1} or {error:1, message:"Your cart is empty"}
 *   GET  /checkout/completed/               "Order number: <n>"
 *
 * Every step answers HTTP 200; failures are reported in the JSON body as {error:1, message}.
 */
export const SHIPPING = { ground: 'Ground___Shipping.FixedRate', nextDayAir: 'Next Day Air___Shipping.FixedRate' };
export const PAYMENT = { cashOnDelivery: 'Payments.CashOnDelivery', checkMoneyOrder: 'Payments.CheckMoneyOrder' };

export class Checkout_Api extends Base_Api {
  constructor(request) {
    super(request, 'Checkout_Api');
  }

  async start() {
    return await this.get('/onepagecheckout');
  }

  async saveBilling(addressId) {
    return await this.step('/checkout/OpcSaveBilling/', { billing_address_id: String(addressId) });
  }

  async saveShipping(addressId) {
    return await this.step('/checkout/OpcSaveShipping/', { shipping_address_id: String(addressId), PickUpInStore: 'false' });
  }

  async saveShippingMethod(shippingOption) {
    return await this.step('/checkout/OpcSaveShippingMethod/', { shippingoption: shippingOption });
  }

  async savePaymentMethod(paymentMethod) {
    return await this.step('/checkout/OpcSavePaymentMethod/', { paymentmethod: paymentMethod });
  }

  async savePaymentInfo() {
    return await this.step('/checkout/OpcSavePaymentInfo/', {});
  }

  async confirmOrder() {
    return await this.step('/checkout/OpcConfirmOrder/', {});
  }

  /** Order number shown on the "completed" page right after confirmOrder(). */
  async getCompletedOrderNumber() {
    const { html } = await this.getHtml('/checkout/completed/');
    return matchFirst(html, /Order number:\s*(\d+)/);
  }

  /**
   * Full checkout of the current cart, for tests where an order is a precondition.
   * Throws with the server's message when any step reports an error. Returns the order number.
   */
  async placeOrder(addressId, { shipping = SHIPPING.ground, payment = PAYMENT.cashOnDelivery } = {}) {
    await this.start();
    const steps = [
      ['billing', () => this.saveBilling(addressId)],
      ['shipping', () => this.saveShipping(addressId)],
      ['shipping method', () => this.saveShippingMethod(shipping)],
      ['payment method', () => this.savePaymentMethod(payment)],
      ['payment info', () => this.savePaymentInfo()],
      ['confirm', () => this.confirmOrder()],
    ];
    for (const [name, runStep] of steps) {
      const { body } = await runStep();
      if (body.error) {
        throw new Error(`Checkout step "${name}" failed: ${body.message}`);
      }
    }
    return await this.getCompletedOrderNumber();
  }

  async step(path, form) {
    const response = await this.post(path, { form });
    return { response, body: await this.readJson(response) };
  }
}
