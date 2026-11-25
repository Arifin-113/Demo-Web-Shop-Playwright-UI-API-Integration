// @ts-check
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { env } from './src/config/env.js';

/**
 * Playwright configuration: Demo Web Shop UI + API integration suite.
 *
 * Three projects, one per layer (each test runs exactly once):
 *   api          tests/api          request fixture only, no browser is launched
 *   ui           tests/ui           browser through page objects
 *   integration  tests/integration  browser + API clients sharing one session
 */

// A new report folder per run, so old reports are never overwritten: playwright-report/Report-2026-11-05_T_10-30-15
// Kept short on purpose. Two details: the date is local time (toISOString() is UTC, so before
// 06:00 in Dhaka it would print yesterday's date), and seconds are kept so two runs in one minute don't collide.
const now = new Date();
const formatted = `${now.toLocaleDateString('en-CA')}_T_${now.toTimeString().slice(0, 8).replace(/:/g, '-')}`;
export const REPORT_FOLDER = path.join(process.cwd(), 'playwright-report', `Report-${formatted}`);

export default defineConfig({
  testDir: './tests',

  // Every test creates its own user and data, so tests can run in parallel. Workers are kept low
  // on purpose: the target is a shared public demo site, not ours to load-test.
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : 4,

  timeout: 3 * 60 * 1000, // public site: address writes alone take 20-30 s; a checkout is ~10 round-trips
  expect: { timeout: 10 * 1000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: REPORT_FOLDER, open: 'never' }],
  ],

  use: {
    baseURL: env.baseURL,
    headless: env.isCI ? true : env.headless,
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    // Evidence for EVERY test (same as the SauceDemo / Restful Booker repos): the HTML report's data/ folder
    // holds each test's video (.webm) and trace (.zip). API-project tests have no browser, so they get a
    // trace (every HTTP call with headers + bodies) but no video.
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'on',
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'integration',
      testDir: './tests/integration',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
