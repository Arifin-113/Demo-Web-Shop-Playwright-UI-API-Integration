import { Base_Api } from './Base_Api.js';
import { parseCartRows } from './cartRows.js';

/**
 * Wishlist_Api: the wishlist (shoppingCartTypeId = 2).
 *
 *   POST /addproducttocart/details/<productId>/2  JSON {success, message}. Many products answer
 *                                                 {success:false, message:["Wishlist is disabled for this product"]}
 *   GET  /wishlist                                HTML rows (same markup as the cart)
 *   POST /wishlist                                removefromcart=<itemId>, updatecart
 */
const WISHLIST = 2;

export class Wishlist_Api extends Base_Api {
  constructor(request) {
    super(request, 'Wishlist_Api');
  }

  async add(productId, quantity = 1) {
    const response = await this.post(`/addproducttocart/details/${productId}/${WISHLIST}`, {
      form: { [`addtocart_${productId}.EnteredQuantity`]: String(quantity) },
    });
    return { response, body: await this.readJson(response) };
  }

  async getItems() {
    const { html } = await this.getHtml('/wishlist');
    return parseCartRows(html);
  }

  async removeItem(itemId) {
    return await this.post('/wishlist', {
      form: { removefromcart: String(itemId), updatecart: 'Update wishlist' },
      maxRedirects: 0,
    });
  }

  async clear() {
    for (const item of await this.getItems()) {
      await this.removeItem(item.itemId);
    }
  }
}
