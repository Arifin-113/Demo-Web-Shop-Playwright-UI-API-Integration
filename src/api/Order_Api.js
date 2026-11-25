import { Base_Api } from './Base_Api.js';
import { cleanText, matchAll, matchFirst, toNumber } from '../utils/html.js';

/**
 * Order_Api: read-only order history. A customer cannot delete or cancel orders on this site.
 *
 *   GET /customer/orders          list of the customer's orders
 *   GET /orderdetails/<orderId>   one order · 302 -> /login when it is not the caller's order
 */
export class Order_Api extends Base_Api {
  constructor(request) {
    super(request, 'Order_Api');
  }

  /** Order numbers in the customer's history, newest first. */
  async listOrderNumbers() {
    const { html } = await this.getHtml('/customer/orders');
    return matchAll(html, /orderdetails\/(\d+)/g);
  }

  /** Raw response (no redirect following), for access-control checks. */
  async getOrderDetailsResponse(orderId) {
    return await this.get(`/orderdetails/${orderId}`, { maxRedirects: 0 });
  }

  /** { orderNumber, status, total, items: [{ name, price, quantity, total }] } */
  async getOrderDetails(orderId) {
    const { html } = await this.getHtml(`/orderdetails/${orderId}`);
    const rows = matchAll(html, /<tr>\s*(<td class="a-left name">[\s\S]*?)<\/tr>/g);
    return {
      orderNumber: matchFirst(html, /<strong>Order #(\d+)<\/strong>/),
      status: matchFirst(html, /<span>Order Status:([^<]*)<\/span>/),
      total: toNumber(matchFirst(html, /<div class="order-total">\s*Order Total:\s*<strong>([^<]*)/)),
      items: rows.map((row) => ({
        name: cleanText(row.match(/<td class="a-left name">([\s\S]*?)<\/td>/)?.[1]),
        price: toNumber(cleanText(row.match(/<td class="a-right price">([\s\S]*?)<\/td>/)?.[1])),
        quantity: toNumber(cleanText(row.match(/<td class="a-center quantity">([\s\S]*?)<\/td>/)?.[1])),
        total: toNumber(cleanText(row.match(/<td class="a-right total">([\s\S]*?)<\/td>/)?.[1])),
      })),
    };
  }
}
