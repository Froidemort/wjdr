import { defineConfig, devices } from '@playwright/test'

const deployedBaseUrl = process.env.PLAYWRIGHT_BASE_URL
const localBaseUrl = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['deploy-smoke.spec.ts'],
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: deployedBaseUrl ?? localBaseUrl,
    trace: 'retain-on-failure',
  },
  webServer: deployedBaseUrl
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
        port: 4173,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
