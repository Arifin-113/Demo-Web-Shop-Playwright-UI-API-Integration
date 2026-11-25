/**
 * Catalogue products used by the tests. Every value was verified against the live site
 * (product page, add-to-cart and add-to-wishlist responses).
 *
 *   id        product id used in /addproducttocart/... URLs and data-productid
 *   slug      SEO URL of the product page
 *   price     unit price shown on the product page
 *   wishlist  whether the store allows this product on a wishlist
 */
export const PRODUCTS = {
  laptop: { id: 31, slug: '141-inch-laptop', name: '14.1-inch Laptop', price: 1590.0, wishlist: false },
  computingBook: { id: 13, slug: 'computing-and-internet', name: 'Computing and Internet', price: 10.0, wishlist: false },
  smartphone: { id: 43, slug: 'smartphone', name: 'Smartphone', price: 100.0, wishlist: true },
  healthBook: { id: 22, slug: 'health', name: 'Health Book', price: 10.0, wishlist: true },
  // Configurable product: needs Processor / RAM / HDD choices, so a quick "catalog" add redirects to its page.
  cheapComputer: { id: 72, slug: 'build-your-cheap-own-computer', name: 'Build your cheap own computer' },
};

export const UNKNOWN_PRODUCT_ID = 999999;

/** Fixed fees the store adds at checkout (Cash On Delivery = 7.00, Ground shipping = 0.00). */
export const CHECKOUT_FEES = {
  cashOnDelivery: 7.0,
  groundShipping: 0.0,
};
