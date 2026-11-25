import { createLogger } from '../utils/logger.js';

/**
 * Base_Api: shared plumbing for every API client.
 *
 * Wraps a Playwright APIRequestContext with request/response logging and turns low-level
 * network failures into errors that say which call failed. It deliberately does NOT assert on
 * status codes: tests decide what is expected (a 302 is success for a form post on this site).
 *
 * The request context passed in decides whose session is used:
 *  - the `request` fixture        -> standalone API session (no browser)
 *  - `page.context().request`     -> shares cookies with the browser page (UI + API integration)
 */
export class Base_Api {
  constructor(request, scope) {
    this.request = request;
    this.log = createLogger(scope);
  }

  /** `tolerateTimeout: true` marks a call whose timeout the caller handles (logged as warn, not error). */
  async send(method, path, { tolerateTimeout = false, ...options } = {}) {
    let response;
    try {
      response = await this.request.fetch(path, { method, ...options });
    } catch (error) {
      // First line only: Playwright's call log repeats every request header, including session cookies.
      const reason = error.message.split('\n')[0];
      if (tolerateTimeout && reason.includes('Timeout')) {
        this.log.warn(`${method} ${path} got no response in time: ${reason}`);
      } else {
        this.log.error(`${method} ${path} failed before a response: ${reason}`);
      }
      throw new Error(`${method} ${path} failed: ${reason}`, { cause: error });
    }
    const location = response.headers()['location'];
    const redirectNote = location ? ` -> ${location}` : '';
    this.log.info(`${method} ${path} ${response.status()}${redirectNote}`);
    return response;
  }

  get(path, options) {
    return this.send('GET', path, options);
  }

  post(path, options) {
    return this.send('POST', path, options);
  }

  /** GET a page and return its HTML. Throws when the page itself cannot be loaded. */
  async getHtml(path) {
    const response = await this.get(path);
    if (!response.ok()) {
      throw new Error(`GET ${path} returned HTTP ${response.status()}`);
    }
    return { response, html: await response.text() };
  }

  /** Parse a JSON body; throws with the start of the body when it is not JSON (e.g. an error page). */
  async readJson(response) {
    const body = await response.text();
    try {
      return JSON.parse(body);
    } catch {
      throw new Error(`Expected JSON from ${response.url()} (HTTP ${response.status()}) but got: ${body.slice(0, 200)}`);
    }
  }
}
