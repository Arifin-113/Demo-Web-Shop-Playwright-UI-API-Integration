import { test, expect } from '../../src/fixtures/fixtures.js';
import { buildUser } from '../../src/data/users.js';
import { createApiClients } from '../../src/api/index.js';

/**
 * Session bridge: `pageApi` uses page.context().request, so the API and the browser share the
 * same cookie jar. A login on one side is a login on the other.
 */
test.describe('Auth: API <-> UI session sharing', () => {
  test('user registered through the API is logged in on the UI', { tag: '@smoke' }, async ({ pages, loggedInUser }) => {
    const { account } = pages;
    await account.open('/customer/info');
    await expect(account.header.accountLink).toHaveText(loggedInUser.email);
    await expect(account.page.locator('#Email')).toHaveValue(loggedInUser.email);
    await expect(account.page.locator('#FirstName')).toHaveValue(loggedInUser.firstName);
    await expect(account.page.locator('#LastName')).toHaveValue(loggedInUser.lastName);
  });

  test('UI registration creates an account the API can log in to', async ({ pages, playwright, baseURL }) => {
    const user = buildUser();
    await pages.register.open();
    await pages.register.register(user);
    await expect(pages.register.result).toBeVisible();

    // A separate, clean API session proves the account exists server-side (not just a cookie).
    const freshContext = await playwright.request.newContext({ baseURL });
    try {
      const freshApi = createApiClients(freshContext);
      const { response } = await freshApi.auth.login(user.email, user.password);
      expect(response.status()).toBe(302);
      expect(await freshApi.auth.getAccountEmail()).toBe(user.email);
    } finally {
      await freshContext.dispose();
    }
  });

  test('UI login and logout are reflected in the API session', async ({ pages, pageApi, apiUser }) => {
    const { login } = pages;

    await test.step('before login the API session is anonymous', async () => {
      expect(await pageApi.auth.getAccountEmail()).toBeNull();
    });

    await test.step('UI login -> API session is the user', async () => {
      await login.open();
      await login.login(apiUser.email, apiUser.password);
      await expect(login.header.accountLink).toHaveText(apiUser.email);
      expect(await pageApi.auth.getAccountEmail()).toBe(apiUser.email);
    });

    await test.step('UI logout -> API session is anonymous again', async () => {
      await login.header.logout();
      await expect(login.header.loginLink).toBeVisible();
      expect(await pageApi.auth.getAccountEmail()).toBeNull();
    });
  });

  test('API logout logs the browser out', async ({ pages, pageApi, loggedInUser }) => {
    const { account } = pages;
    await account.open('/');
    await expect(account.header.accountLink).toHaveText(loggedInUser.email);

    await pageApi.auth.logout();

    await account.open('/customer/info');
    await expect(account.page).toHaveURL(/\/login\?ReturnUrl=/);
  });
});
