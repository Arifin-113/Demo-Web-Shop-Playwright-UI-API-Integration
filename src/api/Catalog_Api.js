import { Base_Api } from './Base_Api.js';
import { cleanText, matchAll, matchFirst, toNumber } from '../utils/html.js';

/**
 * Catalog_Api: read-only product lookups.
 *
 *   GET /search?q=<term>    product grid, or "No products were found that matched your criteria."
 *   GET /<product-slug>     product page: name in <h1 itemprop="name">, price in span.price-value-<id>
 */
export class Catalog_Api extends Base_Api {
  constructor(request) {
    super(request, 'Catalog_Api');
  }

  /** Product titles returned by a search. */
  async search(term) {
    const { html } = await this.getHtml(`/search?q=${encodeURIComponent(term)}`);
    return matchAll(html, /<h2 class="product-title">\s*<a href="[^"]+">([^<]+)<\/a>/g).map(cleanText);
  }

  /** { name, price } read from a product page. */
  async getProduct(product) {
    const { html } = await this.getHtml(`/${product.slug}`);
    return {
      name: matchFirst(html, /<h1 itemprop="name">([\s\S]*?)<\/h1>/),
      price: toNumber(matchFirst(html, new RegExp(`class="price-value-${product.id}"[^>]*>([^<]*)`))),
    };
  }
}
