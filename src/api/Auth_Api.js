import { Base_Api } from './Base_Api.js';
import { extractAntiForgeryToken, extractValidationErrors, matchFirst } from '../utils/html.js';

/**
 * Auth_Api: registration, login, logout and account lookup.
 *
 *   GET  /register         HTML form carrying an anti-forgery token (__RequestVerificationToken)
 *   POST /register         302 -> /registerresult/1 on success · 200 + validation errors on failure
 *   POST /login            302 -> / on success · 200 + "Login was unsuccessful…" on failure
 *   GET  /logout           302 -> /
 *   GET  /customer/info    200 when logged in · 302 -> /login?ReturnUrl=… when anonymous
 *
 * Authentication is cookie based: a successful register/login sets the HttpOnly cookie
 * NOPCOMMERCE.AUTH on the request context. The site issues no bearer / JWT tokens.
 */
export const AUTH_COOKIE = 'NOPCOMMERCE.AUTH';

export class Auth_Api extends Base_Api {
  constructor(request) {
    super(request, 'Auth_Api');
  }

  /** Register a user. Returns { response, errors } (errors = the page's validation messages). */
  async register(user) {
    const { html } = await this.getHtml('/register');
    const token = extractAntiForgeryToken(html);
    if (!token) {
      throw new Error('Anti-forgery token not found on /register');
    }
    const response = await this.post('/register', {
      form: {
        __RequestVerificationToken: token,
        Gender: user.gender,
        FirstName: user.firstName,
        LastName: user.lastName,
        Email: user.email,
        Password: user.password,
        ConfirmPassword: user.confirmPassword ?? user.password,
        'register-button': 'Register',
      },
      maxRedirects: 0,
    });
    return { response, errors: await this.errorsOf(response) };
  }

  /** Log in. Returns { response, errors }. A 302 means the credentials were accepted. */
  async login(email, password) {
    const response = await this.post('/login', {
      form: { Email: email, Password: password, RememberMe: 'false' },
      maxRedirects: 0,
    });
    return { response, errors: await this.errorsOf(response) };
  }

  async logout() {
    return await this.get('/logout', { maxRedirects: 0 });
  }

  /** E-mail of the logged-in account, or null when the session is anonymous. */
  async getAccountEmail() {
    const response = await this.get('/customer/info', { maxRedirects: 0 });
    if (response.status() !== 200) {
      return null;
    }
    return matchFirst(await response.text(), /id="Email"[^>]*value="([^"]*)"/);
  }

  async errorsOf(response) {
    if (response.status() !== 200) {
      return [];
    }
    return extractValidationErrors(await response.text());
  }
}
