import { expect, test } from '@playwright/test'

test('deploy smoke: app shell, manifest and service worker are reachable', async ({ page, request }) => {
  const manifestResponse = await request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBe(true)

  const manifest = await manifestResponse.json()
  expect(manifest.name).toBe('Warhammer Sheet')
  expect(manifest.display).toBe('standalone')

  const serviceWorkerResponse = await request.get('/sw.js')
  expect(serviceWorkerResponse.ok()).toBe(true)

  await page.goto('/')
  await expect(page).toHaveTitle(/Warhammer Sheet/)
  await expect(page.getByTestId('theme-current-value')).toBeVisible()

  const manifestLink = page.locator('link[rel="manifest"]')
  await expect(manifestLink).toHaveAttribute('href', /manifest\.webmanifest/)
})
