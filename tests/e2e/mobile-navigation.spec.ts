import type { Page } from '@playwright/test'
import { openCharacterSheet } from './fixtures/characterSheet'
import { expect, test } from './fixtures/supabaseAuth'

test.use({ viewport: { width: 375, height: 667 } })

test.describe('Mobile dock and character tabs (authenticated, mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await openCharacterSheet(page)
  })

  test('character tabs bar sits flush against the dock, no gap', async ({ page }) => {
    const tabs = page.getByRole('navigation', { name: 'Sections du personnage' })
    const dock = page.locator('.dock')

    const [tabsBox, dockBox] = await Promise.all([tabs.boundingBox(), dock.boundingBox()])

    expect(tabsBox).not.toBeNull()
    expect(dockBox).not.toBeNull()
    expect(Math.abs(dockBox!.y - (tabsBox!.y + tabsBox!.height))).toBeLessThanOrEqual(1)
  })

  test.describe('Aperçu tab and section scrolling', () => {
    test('Aperçu is the first tab and is selected by default', async ({ page }) => {
      const tabs = page.getByRole('tab')

      await expect(tabs).toHaveCount(4)
      await expect(tabs.first()).toHaveAccessibleName('Aperçu')
      await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByRole('button', { name: 'Retour en haut de la fiche' })).toHaveCount(0)
    })

    test('all sections stay in the page flow', async ({ page }) => {
      for (const id of ['overview', 'stats', 'skills', 'inventory']) {
        await expect(page.locator(`#character-panel-${id}`)).toBeVisible()
      }
    })

    for (const [tabName, panelId] of [
      ['Stats', 'stats'],
      ['Compétences', 'skills'],
      ['Inventaire', 'inventory'],
    ] as const) {
      test(`clicking ${tabName} brings its section into view and keeps the tab selected`, async ({ page }) => {
        const tab = page.getByRole('tab', { name: tabName })
        await tab.click()

        await expect(page.locator(`#character-panel-${panelId}`)).toBeInViewport()
        await expect(tab).toHaveAttribute('aria-selected', 'true')
        await expect(page.getByRole('tab', { name: 'Aperçu' })).toHaveAttribute('aria-selected', 'false')
      })
    }

    test('Aperçu tab stays visible and scrolls back to the overview', async ({ page }) => {
      const overviewTab = page.getByRole('tab', { name: 'Aperçu' })

      await page.getByRole('tab', { name: 'Inventaire' }).click()
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
      await expect(overviewTab).toBeVisible()

      await overviewTab.click()

      await expect(page.locator('#character-panel-overview')).toBeInViewport()
      await expect(overviewTab).toHaveAttribute('aria-selected', 'true')
    })

    test('scrolling manually updates the active tab', async ({ page }) => {
      await page.locator('#character-panel-skills').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }))

      await expect(page.getByRole('tab', { name: 'Compétences' })).toHaveAttribute('aria-selected', 'true')
    })
  })

  test.describe('tablist keyboard navigation', () => {
    test('ArrowRight moves selection and focus to the next tab, End moves to the last tab', async ({ page }) => {
      const overviewTab = page.getByRole('tab', { name: 'Aperçu' })
      const statsTab = page.getByRole('tab', { name: 'Stats' })
      const skillsTab = page.getByRole('tab', { name: 'Compétences' })
      const inventoryTab = page.getByRole('tab', { name: 'Inventaire' })

      await overviewTab.focus()
      await page.keyboard.press('ArrowRight')

      await expect(statsTab).toHaveAttribute('aria-selected', 'true')
      await expect(statsTab).toBeFocused()

      await page.keyboard.press('ArrowRight')

      await expect(skillsTab).toHaveAttribute('aria-selected', 'true')
      await expect(skillsTab).toBeFocused()

      await page.keyboard.press('End')

      await expect(inventoryTab).toHaveAttribute('aria-selected', 'true')
      await expect(inventoryTab).toBeFocused()

      await page.keyboard.press('Home')

      await expect(overviewTab).toHaveAttribute('aria-selected', 'true')
      await expect(overviewTab).toBeFocused()
    })
  })

  test.describe('options menu', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('.dock').getByRole('button', { name: 'Options' }).click()
      await expect(page.locator('.dock').getByRole('link', { name: 'Profil' })).toBeVisible()
    })

    // Two frames let an async re-open (the previous flicker bug) surface before asserting.
    async function expectStaysClosed(page: Page): Promise<void> {
      const profileLink = page.locator('.dock').getByRole('link', { name: 'Profil' })
      await expect(profileLink).toBeHidden()
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      await expect(profileLink).toBeHidden()
    }

    test('stays closed after clicking outside', async ({ page }) => {
      await page.getByRole('heading', { name: 'Aperçu' }).click()

      await expectStaysClosed(page)
    })

    test('stays closed after pressing Escape', async ({ page }) => {
      await page.keyboard.press('Escape')

      await expectStaysClosed(page)
    })

    test('stays closed after clicking a menu item', async ({ page }) => {
      await page.locator('.dock').getByRole('link', { name: 'Profil' }).click()

      await expect(page).toHaveURL(/\/profile$/)
      await expectStaysClosed(page)
    })
  })
})
