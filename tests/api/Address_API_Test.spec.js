import { test, expect } from '../../src/fixtures/fixtures.js';
import { buildAddress, MESSAGES } from '../../src/data/users.js';

test.describe('Address book API', () => {
  test('create an address, read it, delete it', async ({ api, apiUser }) => {
    test.info().annotations.push({
      type: 'known-issue',
      description: 'DEFECT-1: GET /customer/addressdelete/{id} deletes the address but gives no response within 60 s',
    });
    const address = buildAddress(apiUser);

    await test.step('POST /customer/addressadd -> 302 to the address list', async () => {
      const { response, errors } = await api.address.add(address);
      expect(response.status()).toBe(302);
      expect(response.headers()['location']).toBe('/customer/addresses');
      expect(errors).toEqual([]);
    });

    const saved = await test.step('GET /customer/addresses shows it', async () => {
      const addresses = await api.address.list();
      expect(addresses).toHaveLength(1);
      expect(addresses[0].text).toContain(address.address1);
      expect(addresses[0].text).toContain(`${address.city}, ${address.zip}`);
      expect(addresses[0].text).toContain(address.countryName);
      return addresses[0];
    });

    await test.step('delete it (state verified by reading the list again)', async () => {
      await api.address.delete(saved.id);
      // The delete request never gets a response (see Address_Api.delete), so poll the real state.
      await expect.poll(() => api.address.list(), { timeout: 60000 }).toEqual([]);
    });
  });

  test('an address without a city is rejected and nothing is saved', async ({ api, apiUser }) => {
    const { response, errors } = await api.address.add(buildAddress(apiUser, { city: '' }));
    expect(response.status()).toBe(200);
    expect(errors).toContain(MESSAGES.cityRequired);
    expect(await api.address.list()).toEqual([]);
  });
});
