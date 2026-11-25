import { Base_Page } from './Base_Page.js';

/** Search_Page: /search results grid. */
export class Search_Page extends Base_Page {
  constructor(page) {
    super(page);
    this.productTitles = page.locator('.search-results .product-item .product-title a');
    this.noResults = page.locator('.search-results strong.result');
  }

  async open(term) {
    await super.open(`/search?q=${encodeURIComponent(term)}`);
  }

  productCard(product) {
    return this.page.locator(`.product-item[data-productid="${product.id}"]`);
  }

  async addToCartFromGrid(product) {
    await this.productCard(product).locator('input.product-box-add-to-cart-button').click();
  }
}
