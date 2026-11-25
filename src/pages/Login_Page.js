import { Base_Page } from './Base_Page.js';

/** Login_Page: /login */
export class Login_Page extends Base_Page {
  constructor(page) {
    super(page);
    this.email = page.locator('#Email');
    this.password = page.locator('#Password');
    this.loginButton = page.locator('input.login-button');
    this.errorSummary = page.locator('.message-error .validation-summary-errors');
  }

  async open() {
    await super.open('/login');
  }

  async login(email, password) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.loginButton.click();
  }
}
