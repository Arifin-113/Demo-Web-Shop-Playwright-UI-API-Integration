import { Base_Api } from './Base_Api.js';

/**
 * Newsletter_Api
 *   POST /subscribenewsletter   form email -> JSON {Success: true|false, Result: "<message>"}
 */
export class Newsletter_Api extends Base_Api {
  constructor(request) {
    super(request, 'Newsletter_Api');
  }

  async subscribe(email) {
    const response = await this.post('/subscribenewsletter', { form: { email } });
    return { response, body: await this.readJson(response) };
  }
}
