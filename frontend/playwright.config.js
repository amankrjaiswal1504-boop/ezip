import { defineConfig, devices } from '@playwright/test';

// One end-to-end test of the main booking flow against a throwaway stack
// (in-memory MongoDB + seed + API + Vite). Uses the installed Chrome locally;
// CI installs Playwright's Chromium.
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'retain-on-failure',
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'], ...(process.env.CI ? {} : { channel: 'chrome' }) } }],
  webServer: [
    {
      command: 'node ../backend/scripts/e2e-stack.js',
      url: 'http://localhost:5055/api/health',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npx vite --port 5199 --strictPort',
      url: 'http://localhost:5199',
      env: { VITE_API_URL: 'http://localhost:5055/api' },
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
