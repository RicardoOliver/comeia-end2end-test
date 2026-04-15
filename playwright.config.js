const { defineConfig, devices } = require('playwright/test');

const reporters = [['html', { open: 'never' }]];
if (process.env.ENABLE_ALLURE === '1') {
  reporters.push([
    'allure-playwright',
    {
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: true,
    },
  ]);
}

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  reporter: reporters,
  globalSetup: require.resolve('./global-setup'),
  use: {
    baseURL: process.env.BASE_URL || 'https://teste-colmeia-qa.colmeia-corp.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
    ignoreHTTPSErrors: true,
    viewport: { width: 1366, height: 768 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  retries: 1,
  outputDir: 'test-results',
});
