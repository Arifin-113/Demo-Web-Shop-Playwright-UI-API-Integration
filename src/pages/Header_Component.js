/**
 * Header_Component: top links, cart / wishlist counters and the search box.
 * Composed into every page object as `.header`.
 */
export class Header_Component {
  constructor(page) {
    this.page = page;
    this.registerLink = page.locator('.header-links a.ico-register');
    this.loginLink = page.locator('.header-links a.ico-login');
    this.logoutLink = page.locator('.header-links a.ico-logout');
    this.accountLink = page.locator('.header-links a.account');
    this.cartLink = page.locator('#topcartlink a.ico-cart');
    this.cartQuantity = page.locator('.header-links .cart-qty');
    this.wishlistQuantity = page.locator('.header-links .wishlist-qty');
    this.searchInput = page.locator('#small-searchterms');
    this.searchButton = page.locator('.search-box input[type="submit"]');
  }

  async search(term) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  async logout() {
    await this.logoutLink.click();
  }

  /** "(3)" -> 3 */
  async getCartCount() {
    const text = await this.cartQuantity.innerText();
    return Number(text.replace(/[()]/g, ''));
  }
}
