import { Base_Api } from './Base_Api.js';
import { cleanText, extractValidationErrors, matchAll } from '../utils/html.js';

/**
 * Address_Api: the logged-in customer's address book.
 *
 *   POST /customer/addressadd           302 -> /customer/addresses on success · 200 + errors on failure
 *   GET  /customer/addresses            HTML list (parsed)
 *   GET  /customer/addressdelete/<id>   delete is a GET on this site; it never answers (see delete())
 */
const DELETE_TIMEOUT_MS = 8000;
// Address writes are slow on the live site (20-30 s per add measured), above Playwright's
// 15 s action timeout, so they get their own budget.
const ADD_TIMEOUT_MS = 60000;
export class Address_Api extends Base_Api {
  constructor(request) {
    super(request, 'Address_Api');
  }

  /** Returns { response, errors }. */
  async add(address) {
    const response = await this.post('/customer/addressadd', {
      form: {
        'Address.Id': '0',
        'Address.FirstName': address.firstName,
        'Address.LastName': address.lastName,
        'Address.Email': address.email,
        'Address.Company': address.company ?? '',
        'Address.CountryId': String(address.countryId),
        'Address.StateProvinceId': '0',
        'Address.City': address.city,
        'Address.Address1': address.address1,
        'Address.Address2': '',
        'Address.ZipPostalCode': address.zip,
        'Address.PhoneNumber': address.phone,
        'Address.FaxNumber': '',
      },
      maxRedirects: 0,
      timeout: ADD_TIMEOUT_MS,
    });
    let errors = [];
    if (response.status() === 200) {
      errors = extractValidationErrors(await response.text());
    }
    return { response, errors };
  }

  /** [{ id, text }]: text is the visible address block (name, e-mail, street, city, zip, country). */
  async list() {
    const { html } = await this.getHtml('/customer/addresses');
    const blocks = matchAll(html, /<div class="section address-item">[\s\S]*?<ul class="info">([\s\S]*?)<\/ul>/g);
    const ids = matchAll(html, /addressdelete\/(\d+)/g);
    return blocks.map((block, index) => ({ id: ids[index], text: cleanText(block) }));
  }

  /**
   * Delete an address.
   * LIVE-SITE BEHAVIOUR: the server does delete the address, but this GET does not answer within
   * 60 s, and while it runs every other request of the same session queues behind it (ASP.NET
   * per-session lock). So the call uses a short timeout, treats a timeout as "sent", and callers
   * confirm the result with expect.poll on list(). Returns the response, or null on timeout.
   */
  async delete(addressId) {
    try {
      return await this.get(`/customer/addressdelete/${addressId}`, {
        maxRedirects: 0,
        timeout: DELETE_TIMEOUT_MS,
        tolerateTimeout: true,
      });
    } catch (error) {
      if (!error.message.includes('Timeout')) {
        throw error;
      }
      return null;
    }
  }

  /** Teardown helper. Deletes are sent together so the hanging responses cost one timeout, not one per address. */
  async deleteAll() {
    const addresses = await this.list();
    await Promise.all(addresses.map((address) => this.delete(address.id)));
  }
}
