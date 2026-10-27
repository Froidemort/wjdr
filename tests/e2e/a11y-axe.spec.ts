import AxeBuilder from '@axe-core/playwright'
import { expect, test as publicTest, type Page } from '@playwright/test'
import { SPLASH_STORAGE_KEY } from '../../src/composables/useSplashSeen'
import { openCharacterSheet } from './fixtures/characterSheet'
import { test as authTest } from './fixtures/supabaseAuth'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function expectNoViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).exclude('[class*="vue-devtools"]').analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ') + ' <' + n.html.slice(0, 160) + '>').join(' | ')}`)).toEqual([])
}

publicTest.describe('Axe (public pages)', () => {
  publicTest.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => window.localStorage.setItem(key, String(Date.now())), SPLASH_STORAGE_KEY)
    await page.route('**/rest/v1/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    )
  })

  for (const path of ['/', '/compendium', '/compendium/spells']) {
    publicTest(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('html.app-splash-active')).toHaveCount(0)
      await expectNoViolations(page)
    })
  }
})

authTest.describe('Axe (character sheet, mobile)', () => {
  authTest.use({ viewport: { width: 375, height: 667 } })

  authTest('character sheet has no WCAG A/AA violations', async ({ page }) => {
    await openCharacterSheet(page)
    await expectNoViolations(page)
  })
})
