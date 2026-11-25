import { cleanText, matchAll, toNumber } from '../utils/html.js';

/**
 * Parse the rows of the cart (/cart) or wishlist (/wishlist) page into plain objects:
 *   { itemId, name, unitPrice, quantity, subtotal }
 * `itemId` is the shopping-cart-item id the server expects in removefromcart / itemquantity<id>.
 * Shared by Cart_Api and Wishlist_Api because both pages render the same row markup.
 */
export function parseCartRows(html) {
  const rows = matchAll(html, /<tr class="cart-item-row">([\s\S]*?)<\/tr>/g);
  return rows.map((row) => ({
    itemId: row.match(/name="removefromcart" value="(\d+)"/)?.[1] ?? null,
    name: cleanText(row.match(/<td class="product">([\s\S]*?)<\/td>/)?.[1]),
    unitPrice: toNumber(row.match(/<span class="product-unit-price">([^<]*)/)?.[1]),
    quantity: Number(row.match(/name="itemquantity\d+"[^>]*value="(\d+)"/)?.[1]),
    subtotal: toNumber(row.match(/<span class="product-subtotal">([^<]*)/)?.[1]),
  }));
}
