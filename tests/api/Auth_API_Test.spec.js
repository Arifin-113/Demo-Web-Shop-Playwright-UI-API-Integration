import { test, expect } from '../../src/fixtures/fixtures.js';
import { AUTH_COOKIE } from '../../src/api/Auth_Api.js';
import { buildUser, uniqueEmail, MESSAGES } from '../../src/data/users.js';

test.describe('Auth API: register, login, logout, session cookie', () => {
  test('register a new user sets the auth cookie and opens an authenticated session', { tag: '@smoke' }, async ({ api, request }) => {
    const user = buildUser();

    const { response, errors } = await test.step('POST /register with a valid form', async () => {
      return await api.auth.register(user);
    });

    await test.step('302 to the registration result page, no validation errors', async () => {
      expect(response.status()).toBe(302);
      expect(response.headers()['location']).toContain('/registerresult/1');
      expect(errors).toEqual([]);
    });

    await test.step('NOPCOMMERCE.AUTH cookie is set and HttpOnly', async () => {
      const { cookies } = await request.storageState();
      const authCookie = cookies.find((cookie) => cookie.name === AUTH_COOKIE);
      expect(authCookie, 'auth cookie present').toBeDefined();
      expect(authCookie.httpOnly).toBe(true);
    });

    await test.step('/customer/info returns the new account', async () => {
      expect(await api.auth.getAccountEmail()).toBe(user.email);
    });
  });

  test('register with an e-mail that already exists is rejected', async ({ api, apiUser }) => {
    await api.auth.logout();
    const { response, errors } = await api.auth.register(buildUser({ email: apiUser.email }));
    expect(response.status()).toBe(200);
    expect(errors).toContain(MESSAGES.emailAlreadyExists);
  });

  test('register with mismatched passwords is rejected server-side', async ({ api }) => {
    const user = buildUser({ confirmPassword: 'Different@123' });
    const { response, errors } = await api.auth.register(user);
    expect(response.status()).toBe(200);
    expect(errors).toContain(MESSAGES.passwordMismatch);
    expect(await api.auth.getAccountEmail()).toBeNull();
  });

  test('login with valid credentials, then logout ends the session', { tag: '@smoke' }, async ({ api, apiUser }) => {
    await test.step('start anonymous', async () => {
      await api.auth.logout();
      expect(await api.auth.getAccountEmail()).toBeNull();
    });

    await test.step('POST /login -> 302 and the session belongs to the user', async () => {
      const { response, errors } = await api.auth.login(apiUser.email, apiUser.password);
      expect(response.status()).toBe(302);
      expect(errors).toEqual([]);
      expect(await api.auth.getAccountEmail()).toBe(apiUser.email);
    });

    await test.step('GET /logout -> 302 and the session is anonymous again', async () => {
      const response = await api.auth.logout();
      expect(response.status()).toBe(302);
      expect(await api.auth.getAccountEmail()).toBeNull();
    });
  });

  test('login with a wrong password is rejected', async ({ api, apiUser }) => {
    await api.auth.logout();
    const { response, errors } = await api.auth.login(apiUser.email, 'Wrong@Password1');
    expect(response.status()).toBe(200);
    expect(errors).toContain(MESSAGES.loginUnsuccessful);
    expect(errors).toContain(MESSAGES.wrongCredentials);
    expect(await api.auth.getAccountEmail()).toBeNull();
  });

  test('login with an unknown e-mail is rejected', async ({ api }) => {
    const { response, errors } = await api.auth.login(uniqueEmail('nobody'), 'Whatever@123');
    expect(response.status()).toBe(200);
    expect(errors).toContain(MESSAGES.noCustomerAccount);
  });

  test('account pages redirect an anonymous session to login', async ({ api }) => {
    const response = await api.auth.get('/customer/info', { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toContain('/login?ReturnUrl=');
  });
});
