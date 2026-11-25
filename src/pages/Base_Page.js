import { Header_Component } from './Header_Component.js';

/**
 * Base_Page: what every page shares: navigation, the header and the AJAX notification bar.
 */
export class Base_Page {
  constructor(page) {
    this.page = page;
    this.header = new Header_Component(page);
    // Green/red bar that slides in after AJAX actions (add to cart, wishlist, newsletter…)
    this.notificationBar = page.locator('#bar-notification');
    this.pageTitle = page.locator('.page-title h1');
  }

  async open(path = '/') {
    await this.page.goto(path);
  }

  /** Wait for the AJAX notification and return its text. */
  async readNotification() {
    await this.notificationBar.waitFor({ state: 'visible' });
    return (await this.notificationBar.innerText()).trim();
  }
}
