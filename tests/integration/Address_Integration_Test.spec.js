import { test, expect } from '../../src/fixtures/fixtures.js';
import { buildAddress, MESSAGES } from '../../src/data/users.js';

test.describe('Address book: API <-> UI', () => {
  test('address created through the API is listed in the UI', async ({ pages, pageApi, loggedInUser }) => {
    const address = buildAddress(loggedInUser);
    const { response } = await pageApi.address.add(address);
    expect(response.status()).toBe(302);

    const { account } = pages;
    await account.openAddresses();
    const card = account.addressItem(address.address1);
    await expect(card).toHaveCount(1);
    await expect(card.locator('.city-state-zip')).toHaveText(`${address.city}, ${address.zip}`);
    await expect(card.locator('.country')).toHaveText(address.countryName);
  });

  test('address created in the UI is stored server-side (verified through the API)', async ({ pages, pageApi, loggedInUser }) => {
    const address = buildAddress(loggedInUser);
    const { account } = pages;

    await account.addAddress(address);
    await expect(account.page).toHaveURL(/\/customer\/addresses$/, { timeout: 60000 }); // address writes are slow
    await expect(account.addressItem(address.address1)).toHaveCount(1);

    const saved = await pageApi.address.list();
    expect(saved).toHaveLength(1);
    expect(saved[0].text).toContain(address.address1);
    expect(saved[0].text).toContain(address.city);
  });

  test('UI validation: an address without a city is not saved (verified through the API)', async ({ pages, pageApi, loggedInUser }) => {
    const { account } = pages;
    await account.addAddress(buildAddress(loggedInUser, { city: '' }));

    await expect(account.form.fieldErrors).toContainText([MESSAGES.cityRequired]);
    await expect(account.page).toHaveURL(/\/customer\/addressadd$/);
    expect(await pageApi.address.list()).toEqual([]);
  });
});
