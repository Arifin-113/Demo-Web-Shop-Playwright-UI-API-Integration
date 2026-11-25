import { Auth_Api } from './Auth_Api.js';
import { Catalog_Api } from './Catalog_Api.js';
import { Cart_Api } from './Cart_Api.js';
import { Wishlist_Api } from './Wishlist_Api.js';
import { Address_Api } from './Address_Api.js';
import { Checkout_Api } from './Checkout_Api.js';
import { Order_Api } from './Order_Api.js';
import { Newsletter_Api } from './Newsletter_Api.js';

/** Every API client bound to ONE request context, so they all share that context's session cookies. */
export function createApiClients(request) {
  return {
    auth: new Auth_Api(request),
    catalog: new Catalog_Api(request),
    cart: new Cart_Api(request),
    wishlist: new Wishlist_Api(request),
    address: new Address_Api(request),
    checkout: new Checkout_Api(request),
    orders: new Order_Api(request),
    newsletter: new Newsletter_Api(request),
  };
}
