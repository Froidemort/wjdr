import { E2E_CAMPAIGN_ID, expect, test } from './fixtures/supabaseAuth'

test('shows the splash once, then not on reload', async ({ page }) => {
  await page.goto(`/campaigns/${E2E_CAMPAIGN_ID}`, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.app-splash')).toBeVisible()

  await expect(page.locator('.app-splash')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('html.app-splash-active')).toHaveCount(0)
  expect(await page.evaluate(() => window.localStorage.getItem('wjdr:splash-last-seen'))).not.toBeNull()

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('#app')).toBeVisible()
  await expect(page.locator('.app-splash')).toHaveCount(0)
  await expect(page.locator('html.app-splash-active')).toHaveCount(0)
})
