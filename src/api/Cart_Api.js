import { Base_Api } from './Base_Api.js';
import { parseCartRows } from './cartRows.js';
import { matchFirst, toNumber } from '../utils/html.js';

/**
 * Cart_Api: the shopping cart (shoppingCartTypeId = 1).
 *
 *   POST /addproducttocart/catalog/<productId>/1/<qty>  JSON {success, message, updatetopcartsectionhtml}
 *                                                       or {redirect} when the product needs attributes
 *   POST /addproducttocart/details/<productId>/1        form addtocart_<id>.EnteredQuantity · same JSON
 *   GET  /cart                                          HTML cart (parsed into rows)
 *   POST /cart (multipart)                              itemquantity<itemId>, removefromcart, updatecart
 *
 * The cart lives on the server and belongs to the session cookie (guest or registered).
 */
const SHOPPING_CART = 1;

export class Cart_Api extends Base_Api {
  constructor(request) {
    super(request, 'Cart_Api');
  }

  /** Quick add from a product grid. Returns { response, body }. */
  async addFromCatalog(productId, quantity = 1) {
    const response = await this.post(`/addproducttocart/catalog/${productId}/${SHOPPING_CART}/${quantity}`);
    return { response, body: await this.readJson(response) };
  }

  /** Add from the product details form (any quantity). Returns { response, body }. */
  async addFromDetails(productId, quantity = 1) {
    const response = await this.post(`/addproducttocart/details/${productId}/${SHOPPING_CART}`, {
      form: { [`addtocart_${productId}.EnteredQuantity`]: String(quantity) },
    });
    return { response, body: await this.readJson(response) };
  }

  /** { items, total } of the current cart. */
  async getCart() {
    const { html } = await this.getHtml('/cart');
    return {
      items: parseCartRows(html),
      total: toNumber(matchFirst(html, /class="product-price order-total"><strong>([^<]*)/)),
    };
  }

  /** Set quantities: { [itemId]: qty }. Items not listed keep their quantity. */
  async updateQuantities(quantities) {
    const { items } = await this.getCart();
    const form = this.currentQuantities(items);
    for (const [itemId, quantity] of Object.entries(quantities)) {
      form[`itemquantity${itemId}`] = String(quantity);
    }
    form.updatecart = 'Update shopping cart';
    return await this.post('/cart', { multipart: form, maxRedirects: 0 });
  }

  async removeItem(itemId) {
    const { items } = await this.getCart();
    const form = { ...this.currentQuantities(items), removefromcart: String(itemId), updatecart: 'Update shopping cart' };
    return await this.post('/cart', { multipart: form, maxRedirects: 0 });
  }

  /** Teardown helper: remove every item (one request per item; a multipart body cannot repeat a key). */
  async clear() {
    const { items } = await this.getCart();
    for (const item of items) {
      await this.removeItem(item.itemId);
    }
  }

  currentQuantities(items) {
    const form = {};
    for (const item of items) {
      form[`itemquantity${item.itemId}`] = String(item.quantity);
    }
    return form;
  }
}
