import { Base_Page } from './Base_Page.js';

/** Product_Page: a product details page, /<slug>. Locators depend on the product id. */
export class Product_Page extends Base_Page {
  constructor(page) {
    super(page);
    this.name = page.locator('.product-name h1');
  }

  async open(product) {
    await super.open(`/${product.slug}`);
  }

  price(product) {
    return this.page.locator(`.price-value-${product.id}`);
  }

  async addToCart(product, quantity = 1) {
    await this.page.locator(`#addtocart_${product.id}_EnteredQuantity`).fill(String(quantity));
    await this.page.locator(`#add-to-cart-button-${product.id}`).click();
  }

  async addToWishlist(product) {
    await this.page.locator(`#add-to-wishlist-button-${product.id}`).click();
  }
}
