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

  test.describe('Aperçu button', () => {
    test('nav shows a back-to-top button alongside the tabs', async ({ page }) => {
      const nav = page.getByRole('navigation', { name: 'Sections du personnage' })

      await expect(nav.getByRole('button', { name: 'Retour en haut de la fiche' })).toBeVisible()
    })

    test('clicking it scrolls #character-overview into view', async ({ page }) => {
      const skillsTab = page.getByRole('tab', { name: 'Compétences' })
      await skillsTab.click()
      await expect(skillsTab).toHaveAttribute('aria-selected', 'true')

      await page.evaluate(() => window.scrollTo({ top: 300 }))
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

      await page.getByRole('navigation', { name: 'Sections du personnage' }).getByRole('button', { name: 'Retour en haut de la fiche' }).click()

      await expect(page.locator('#character-overview')).toBeInViewport()
      await expect
        .poll(() => page.evaluate(() => Math.abs(document.getElementById('character-overview')!.getBoundingClientRect().top)))
        .toBeLessThanOrEqual(2)
    })

    test('does not change the selected tab', async ({ page }) => {
      const skillsTab = page.getByRole('tab', { name: 'Compétences' })
      await skillsTab.click()
      await expect(skillsTab).toHaveAttribute('aria-selected', 'true')

      await page.getByRole('navigation', { name: 'Sections du personnage' }).getByRole('button', { name: 'Retour en haut de la fiche' }).click()

      await expect(skillsTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  test.describe('tablist keyboard navigation', () => {
    test('ArrowRight moves selection and focus to the next tab, End moves to the last tab', async ({ page }) => {
      const statsTab = page.getByRole('tab', { name: 'Stats' })
      const skillsTab = page.getByRole('tab', { name: 'Compétences' })
      const inventoryTab = page.getByRole('tab', { name: 'Inventaire' })

      await statsTab.focus()
      await page.keyboard.press('ArrowRight')

      await expect(skillsTab).toHaveAttribute('aria-selected', 'true')
      await expect(skillsTab).toBeFocused()

      await page.keyboard.press('End')

      await expect(inventoryTab).toHaveAttribute('aria-selected', 'true')
      await expect(inventoryTab).toBeFocused()
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
