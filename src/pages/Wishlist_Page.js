import { Base_Page } from './Base_Page.js';

/** Wishlist_Page: /wishlist */
export class Wishlist_Page extends Base_Page {
  constructor(page) {
    super(page);
    this.rows = page.locator('.wishlist-content tr.cart-item-row');
    this.updateButton = page.locator('input[name="updatecart"]');
    this.addToCartButton = page.locator('input[name="addtocartbutton"]');
    this.emptyMessage = page.locator('.wishlist-content');
  }

  async open() {
    await super.open('/wishlist');
  }

  row(productName) {
    return this.rows.filter({ has: this.page.locator('td.product a', { hasText: productName }) });
  }

  async productNames() {
    return await this.rows.locator('td.product a').allInnerTexts();
  }

  async moveToCart(productName) {
    await this.row(productName).locator('input[name="addtocart"]').check();
    await this.addToCartButton.click();
  }

  async remove(productName) {
    await this.row(productName).locator('input[name="removefromcart"]').check();
    await this.updateButton.click();
  }
}
