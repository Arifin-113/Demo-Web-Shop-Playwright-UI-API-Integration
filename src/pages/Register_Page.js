import { Base_Page } from './Base_Page.js';

/** Register_Page: /register and the /registerresult confirmation. */
export class Register_Page extends Base_Page {
  constructor(page) {
    super(page);
    this.genderMale = page.locator('#gender-male');
    this.genderFemale = page.locator('#gender-female');
    this.firstName = page.locator('#FirstName');
    this.lastName = page.locator('#LastName');
    this.email = page.locator('#Email');
    this.password = page.locator('#Password');
    this.confirmPassword = page.locator('#ConfirmPassword');
    this.registerButton = page.locator('#register-button');
    this.result = page.locator('.registration-result-page .result');
    this.summaryErrors = page.locator('.validation-summary-errors li');
    this.fieldErrors = page.locator('.field-validation-error');
  }

  async open() {
    await super.open('/register');
  }

  async register(user) {
    if (user.gender === 'M') {
      await this.genderMale.check();
    } else {
      await this.genderFemale.check();
    }
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.confirmPassword.fill(user.confirmPassword ?? user.password);
    await this.registerButton.click();
  }
}
