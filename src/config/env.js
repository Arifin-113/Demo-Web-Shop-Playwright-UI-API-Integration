import 'dotenv/config';

/**
 * Central settings, read from `.env` (copy `.env.example`). Every value has a safe default,
 * so the suite also runs with no `.env` at all.
 *
 * Depended on by: playwright.config.js, src/data/*, src/utils/logger.js.
 */

function readBoolean(value, defaultValue) {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

// Strip one trailing slash so '/path' can always be appended safely.
const rawBaseUrl = process.env.BASE_URL || 'https://demowebshop.tricentis.com/';
const baseURL = rawBaseUrl.replace(/\/$/, '');

export const env = {
  baseURL,
  userPassword: process.env.TEST_USER_PASSWORD || 'Test@12345',
  emailDomain: process.env.TEST_EMAIL_DOMAIN || 'mailinator.com',
  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  headless: readBoolean(process.env.HEADLESS, true),
  isCI: readBoolean(process.env.CI, false),
};
