import { Base_Page } from './Base_Page.js';

const SAVE_ADDRESS_TIMEOUT_MS = 60000;

/** Account_Page: "My account" pages: addresses, add address, orders and order details. */
export class Account_Page extends Base_Page {
  constructor(page) {
    super(page);
    this.addressItems = page.locator('.address-list .address-item');
    this.addAddressButton = page.locator('input.add-address-button');
    this.noAddresses = page.locator('.address-list');
    this.orderItems = page.locator('.order-list .order-item');
    this.orderDetailsNumber = page.locator('.order-overview .order-number');
    this.orderDetailsStatus = page.locator('.order-overview .order-details');
    this.orderDetailsTotal = page.locator('.order-overview .order-total strong');
    this.orderDetailsProducts = page.locator('.order-details-page table.data-table td.name');
    // Add / edit address form
    this.form = {
      firstName: page.locator('#Address_FirstName'),
      lastName: page.locator('#Address_LastName'),
      email: page.locator('#Address_Email'),
      country: page.locator('#Address_CountryId'),
      city: page.locator('#Address_City'),
      address1: page.locator('#Address_Address1'),
      zip: page.locator('#Address_ZipPostalCode'),
      phone: page.locator('#Address_PhoneNumber'),
      saveButton: page.locator('input.save-address-button'),
      fieldErrors: page.locator('.field-validation-error'),
    };
  }

  async openAddresses() {
    await this.open('/customer/addresses');
  }

  async openOrders() {
    await this.open('/customer/orders');
  }

  async openOrderDetails(orderNumber) {
    await this.open(`/orderdetails/${orderNumber}`);
  }

  orderItem(orderNumber) {
    return this.orderItems.filter({ hasText: `Order Number: ${orderNumber}` });
  }

  addressItem(text) {
    return this.addressItems.filter({ hasText: text });
  }

  async addAddress(address) {
    await this.open('/customer/addressadd');
    await this.form.firstName.fill(address.firstName);
    await this.form.lastName.fill(address.lastName);
    await this.form.email.fill(address.email);
    await this.form.country.selectOption(String(address.countryId));
    await this.form.city.fill(address.city);
    await this.form.address1.fill(address.address1);
    await this.form.zip.fill(address.zip);
    await this.form.phone.fill(address.phone);
    // ROOT-CAUSE-1: saving an address takes 20-30 s on the live site. click() waits for the navigation it
    // triggers inside its own action timeout (15 s by default), so this one action gets a measured budget.
    await this.form.saveButton.click({ timeout: SAVE_ADDRESS_TIMEOUT_MS });
  }
}
