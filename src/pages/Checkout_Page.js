import { Base_Page } from './Base_Page.js';

/**
 * Checkout_Page: /onepagecheckout. Each section is loaded by AJAX after the previous
 * "Continue", so every step waits for the next section's button to be visible.
 */
export class Checkout_Page extends Base_Page {
  constructor(page) {
    super(page);
    this.billingAddressSelect = page.locator('#billing-address-select');
    this.billingContinue = page.locator('#billing-buttons-container input.new-address-next-step-button');
    this.shippingContinue = page.locator('#shipping-buttons-container input.new-address-next-step-button');
    this.shippingMethodContinue = page.locator('#shipping-method-buttons-container input');
    this.paymentMethodContinue = page.locator('#payment-method-buttons-container input');
    this.paymentInfoContinue = page.locator('#payment-info-buttons-container input');
    this.confirmButton = page.locator('#confirm-order-buttons-container input');
    this.confirmOrderTotal = page.locator('#checkout-confirm-order-load .order-total');
    this.completedTitle = page.locator('.order-completed .title');
    this.orderNumber = page.locator('.order-completed .details li').first();
  }

  shippingMethod(label) {
    return this.page.getByLabel(label, { exact: false });
  }

  paymentMethod(label) {
    return this.page.locator('.payment-method').getByLabel(label);
  }

  /** Walk every step with an already-saved address, Ground shipping and the given payment method. */
  async completeWithSavedAddress({ paymentLabel = 'Cash On Delivery' } = {}) {
    await this.billingContinue.click();
    await this.shippingContinue.click();
    await this.shippingMethodContinue.click();
    await this.paymentMethod(paymentLabel).check();
    await this.paymentMethodContinue.click();
    await this.paymentInfoContinue.click();
    await this.confirmButton.waitFor({ state: 'visible' });
  }

  async confirm() {
    await this.confirmButton.click();
    await this.completedTitle.waitFor({ state: 'visible' });
  }

  /** "Order number: 2410855" -> "2410855" */
  async readOrderNumber() {
    const text = await this.orderNumber.innerText();
    return text.replace(/\D/g, '');
  }
}
