import { test, expect } from '../../src/fixtures/fixtures.js';
import { buildUser, MESSAGES } from '../../src/data/users.js';

test.describe('Auth UI: register, login, logout', () => {
  test('a visitor registers through the form', { tag: '@smoke' }, async ({ pages }) => {
    const user = buildUser();
    const { register } = pages;

    await register.open();
    await register.register(user);

    await expect(register.result).toContainText(MESSAGES.registrationCompleted);
    await expect(register.header.accountLink).toHaveText(user.email);
    await expect(register.header.logoutLink).toBeVisible();
  });

  test('registration shows field errors for an invalid e-mail and short / mismatched passwords', async ({ pages, page }) => {
    const { register } = pages;
    await register.open();
    await register.register(buildUser({ email: 'not-an-email', password: '123', confirmPassword: '456' }));

    await expect(register.fieldErrors).toContainText([MESSAGES.wrongEmail, MESSAGES.passwordTooShort, MESSAGES.passwordMismatch]);
    await expect(page).toHaveURL(/\/register$/);
  });

  test('registration with an existing e-mail is refused (user created through the API)', async ({ pages, apiUser }) => {
    const { register } = pages;
    await register.open();
    await register.register(buildUser({ email: apiUser.email }));

    await expect(register.summaryErrors).toHaveText(MESSAGES.emailAlreadyExists);
  });

  test('an existing user logs in and out (user created through the API)', { tag: '@smoke' }, async ({ pages, apiUser, page }) => {
    const { login } = pages;

    await test.step('log in', async () => {
      await login.open();
      await login.login(apiUser.email, apiUser.password);
      await expect(login.header.accountLink).toHaveText(apiUser.email);
    });

    await test.step('log out', async () => {
      await login.header.logout();
      await expect(login.header.loginLink).toBeVisible();
      await expect(login.header.accountLink).toBeHidden();
      await expect(page).toHaveURL(/\/$/);
    });
  });

  test('login with a wrong password shows an error and stays anonymous', async ({ pages, apiUser }) => {
    const { login } = pages;
    await login.open();
    await login.login(apiUser.email, 'Wrong@Password1');

    await expect(login.errorSummary).toContainText(MESSAGES.loginUnsuccessful);
    await expect(login.errorSummary).toContainText(MESSAGES.wrongCredentials);
    await expect(login.header.loginLink).toBeVisible();
  });
});
