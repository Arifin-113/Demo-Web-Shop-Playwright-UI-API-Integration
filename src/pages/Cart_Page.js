import { Base_Page } from './Base_Page.js';

/** Cart_Page: /cart */
export class Cart_Page extends Base_Page {
  constructor(page) {
    super(page);
    this.rows = page.locator('table.cart tr.cart-item-row');
    this.updateButton = page.locator('input[name="updatecart"]');
    this.orderTotal = page.locator('.cart-total .order-total');
    this.emptyMessage = page.locator('.order-summary-content');
    this.termsOfService = page.locator('#termsofservice');
    this.checkoutButton = page.locator('#checkout');
    this.termsWarning = page.locator('#terms-of-service-warning-box');
  }

  async open() {
    await super.open('/cart');
  }

  row(productName) {
    return this.rows.filter({ has: this.page.locator('a.product-name', { hasText: productName }) });
  }

  quantityInput(productName) {
    return this.row(productName).locator('input.qty-input');
  }

  subtotal(productName) {
    return this.row(productName).locator('.product-subtotal');
  }

  async setQuantity(productName, quantity) {
    await this.quantityInput(productName).fill(String(quantity));
    await this.updateButton.click();
  }

  async remove(productName) {
    await this.row(productName).locator('input[name="removefromcart"]').check();
    await this.updateButton.click();
  }

  async productNames() {
    return await this.rows.locator('a.product-name').allInnerTexts();
  }

  async proceedToCheckout() {
    await this.termsOfService.check();
    await this.checkoutButton.click();
  }
}
