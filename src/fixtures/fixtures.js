import { test as base, expect } from '@playwright/test';
import { createApiClients } from '../api/index.js';
import { buildUser } from '../data/users.js';
import { createLogger } from '../utils/logger.js';
import { Register_Page } from '../pages/Register_Page.js';
import { Login_Page } from '../pages/Login_Page.js';
import { Product_Page } from '../pages/Product_Page.js';
import { Search_Page } from '../pages/Search_Page.js';
import { Cart_Page } from '../pages/Cart_Page.js';
import { Wishlist_Page } from '../pages/Wishlist_Page.js';
import { Checkout_Page } from '../pages/Checkout_Page.js';
import { Account_Page } from '../pages/Account_Page.js';

/**
 * Custom fixtures, the single import for every spec:  import { test, expect } from '../../src/fixtures/fixtures.js'
 *
 *   api           API clients on the standalone `request` context (no browser). For tests/api.
 *   pageApi       API clients on page.context().request. They SHARE COOKIES WITH THE BROWSER PAGE:
 *                 log in through pageApi and the page is logged in; act in the page and pageApi
 *                 sees the same server-side cart / account. This is the UI + API bridge.
 *   pages         every page object, built on `page`.
 *   apiUser       a brand-new user registered (and logged in) through `api`.
 *   loggedInUser  a brand-new user registered through `pageApi`, so the browser starts logged in
 *                 without touching the registration UI.
 *
 * Setup is API-only (fast, no UI). Teardown empties cart + wishlist and deletes addresses.
 * Orders and user accounts cannot be deleted on this site; unique e-mails keep runs independent.
 */
const log = createLogger('fixtures');

async function registerUser(api) {
  const user = buildUser();
  const { response, errors } = await api.auth.register(user);
  if (response.status() !== 302) {
    throw new Error(`Setup failed: could not register ${user.email} (HTTP ${response.status()}): ${errors.join('; ')}`);
  }
  log.info(`registered ${user.email}`);
  return user;
}

// Address deletion goes LAST: on this site it blocks the session for a long time (see Address_Api.delete).
// No API logout: the request / browser context is disposed right after, which ends the session anyway.
async function cleanUpAccount(api, user) {
  try {
    await api.cart.clear();
    await api.wishlist.clear();
    await api.address.deleteAll();
    log.info(`teardown done for ${user.email}`);
  } catch (error) {
    // Teardown must never hide the real test result; log it instead.
    log.warn(`teardown for ${user.email} incomplete: ${error.message}`);
  }
}

export const test = base.extend({
  api: async ({ request }, use) => {
    await use(createApiClients(request));
  },

  pageApi: async ({ page }, use) => {
    await use(createApiClients(page.context().request));
  },

  pages: async ({ page }, use) => {
    await use({
      register: new Register_Page(page),
      login: new Login_Page(page),
      product: new Product_Page(page),
      search: new Search_Page(page),
      cart: new Cart_Page(page),
      wishlist: new Wishlist_Page(page),
      checkout: new Checkout_Page(page),
      account: new Account_Page(page),
    });
  },

  apiUser: async ({ api }, use) => {
    const user = await registerUser(api);
    await use(user);
    await cleanUpAccount(api, user);
  },

  loggedInUser: async ({ pageApi }, use) => {
    const user = await registerUser(pageApi);
    await use(user);
    await cleanUpAccount(pageApi, user);
  },
});

export { expect };
