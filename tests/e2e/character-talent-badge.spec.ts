import type { Page } from '@playwright/test'
import type { FakeBackend } from './fixtures/supabaseAuth'
import { openCharacterSheet } from './fixtures/characterSheet'
import { expect, test } from './fixtures/supabaseAuth'

// Mirrors the panel's `max-h-72` (18rem = 288px) list plus the surrounding `p-3` padding (24px) with
// a small margin of error for borders/shadow.
const PANEL_MAX_HEIGHT = 288 + 32

interface ViewportProject {
  name: string
  viewport: { width: number; height: number }
  hasTouch: boolean
  isMobile: boolean
}

const DESKTOP: ViewportProject = { name: 'desktop', viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false }
const MOBILE: ViewportProject = { name: 'mobile', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }
const PROJECTS = [DESKTOP, MOBILE]

// Seeds one INT skill linked to `count` owned talents (dedup is per stat, so this alone drives the badge count).
function seedIntTalents(backend: FakeBackend, count: number): void {
  backend.stats.push({ stat_code: 'INT', base_value: 30, current_advanced: 0, total_advanced: 10 })
  backend.staticStats.push({ code: 'INT', is_secondary: false })
  backend.skillsCatalog.push({
    id: 'skill-int-1',
    name: 'Savoir (Académique)',
    stat_code: 'INT',
    specialization: 'Histoire',
    description: 'Connaissances historiques.',
    is_basic: false,
  })
  backend.characterSkills.push({ skill_id: 'skill-int-1', mastery_level: 1 })
  for (let index = 1; index <= count; index += 1) {
    const talentId = `talent-int-${index}`
    backend.talentsCatalog.push({
      id: talentId,
      name: `Talent INT ${index}`,
      specialization: null,
      description: `Description du talent ${index}.`,
    })
    backend.characterTalents.push({ talent_id: talentId })
    backend.skillsTalentLinks.push({ skill_id: 'skill-int-1', talent_id: talentId })
  }
}

async function expandCard(page: Page, statCode: string): Promise<void> {
  await page.getByRole('tab', { name: /^Stat/ }).click()
  await page.getByRole('button', { name: new RegExp(`^${statCode}\\b`) }).click()
  await expect(page.getByRole('heading', { name: statCode, exact: true })).toBeVisible()
}

async function revealPanel(page: Page, project: ViewportProject, badge: ReturnType<Page['getByRole']>): Promise<void> {
  if (project === DESKTOP) {
    await badge.hover()
  } else {
    await badge.tap()
  }
}

for (const project of PROJECTS) {
  test.describe(`Characteristic talent badge (${project.name})`, () => {
    test.use({ viewport: project.viewport, hasTouch: project.hasTouch, isMobile: project.isMobile })

    test('badge is visible in the expanded card header with an accessible name', async ({ page, backend }) => {
      seedIntTalents(backend, 2)
      await openCharacterSheet(page)
      await expandCard(page, 'INT')

      const badge = page.getByRole('button', { name: /talents? liés/ })
      await expect(badge).toBeVisible()
    })

    test('panel is hidden until revealed, then shows each linked talent', async ({ page, backend }) => {
      seedIntTalents(backend, 2)
      await openCharacterSheet(page)
      await expandCard(page, 'INT')

      const badge = page.getByRole('button', { name: '2 talents liés à INT' })
      const panel = page.getByRole('group', { name: 'Talents liés à INT' })
      await expect(panel).toBeHidden()

      await revealPanel(page, project, badge)

      await expect(panel).toBeVisible()
      await expect(panel.getByText('Talent INT 1')).toBeVisible()
      await expect(panel.getByText('Description du talent 1.')).toBeVisible()
      await expect(panel.getByText('Talent INT 2')).toBeVisible()
      await expect(panel.getByText('Description du talent 2.')).toBeVisible()
    })

    test('Escape closes the panel', async ({ page, backend }) => {
      seedIntTalents(backend, 2)
      await openCharacterSheet(page)
      await expandCard(page, 'INT')

      const badge = page.getByRole('button', { name: '2 talents liés à INT' })
      const panel = page.getByRole('group', { name: 'Talents liés à INT' })
      await badge.click()
      await expect(panel).toBeVisible()

      await page.keyboard.press('Escape')

      await expect(panel).toBeHidden()
    })

    test('clicking outside the panel closes it', async ({ page, backend }) => {
      seedIntTalents(backend, 2)
      await openCharacterSheet(page)
      await expandCard(page, 'INT')

      const badge = page.getByRole('button', { name: '2 talents liés à INT' })
      const panel = page.getByRole('group', { name: 'Talents liés à INT' })
      await badge.click()
      await expect(panel).toBeVisible()

      await page.getByRole('heading', { name: 'Aperçu' }).click()

      await expect(panel).toBeHidden()
    })

    test('clicking the badge does not collapse the expanded card', async ({ page, backend }) => {
      seedIntTalents(backend, 2)
      await openCharacterSheet(page)
      await expandCard(page, 'INT')

      const badge = page.getByRole('button', { name: '2 talents liés à INT' })
      await badge.click()

      const statButton = page.getByRole('button', { name: /^INT\b/ })
      await expect(statButton).toBeVisible()
      await expect(statButton).toHaveAttribute('aria-expanded', 'true')
    })

    test('badge is absent when the stat has no linked talents', async ({ page }) => {
      await openCharacterSheet(page)
      await expandCard(page, 'CC')

      await expect(page.getByRole('button', { name: /talents? liés/ })).toHaveCount(0)
    })

    test('panel stays within the viewport, below the badge, with no horizontal overflow', async ({ page, backend }) => {
      seedIntTalents(backend, 2)
      await openCharacterSheet(page)
      await expandCard(page, 'INT')

      const badge = page.getByRole('button', { name: '2 talents liés à INT' })
      const panel = page.getByRole('group', { name: 'Talents liés à INT' })
      await revealPanel(page, project, badge)
      await expect(panel).toBeVisible()

      const viewportSize = page.viewportSize()
      expect(viewportSize).not.toBeNull()

      const badgeBox = await badge.boundingBox()
      const panelBox = await panel.boundingBox()
      expect(badgeBox).not.toBeNull()
      expect(panelBox).not.toBeNull()

      // Anchored right of the stat label, below the badge row (strict: no vertical overlap).
      expect(panelBox!.y).toBeGreaterThanOrEqual(badgeBox!.y + badgeBox!.height - 1)
      expect(panelBox!.x).toBeGreaterThanOrEqual(0)
      expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(viewportSize!.width)

      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true)
    })

    test('long talent list (8+) is scrollable within a bounded panel height', async ({ page, backend }) => {
      seedIntTalents(backend, 9)
      await openCharacterSheet(page)
      await expandCard(page, 'INT')

      const badge = page.getByRole('button', { name: '9 talents liés à INT' })
      const panel = page.getByRole('group', { name: 'Talents liés à INT' })
      await revealPanel(page, project, badge)
      await expect(panel).toBeVisible()
      await expect(panel.getByText('Talent INT 9')).toBeVisible()

      const panelBox = await panel.boundingBox()
      expect(panelBox).not.toBeNull()
      expect(panelBox!.height).toBeLessThanOrEqual(PANEL_MAX_HEIGHT)

      const list = panel.getByRole('list')
      const scrollable = await list.evaluate((el) => el.scrollHeight > el.clientHeight)
      expect(scrollable).toBe(true)
    })
  })
}

test.describe('Characteristic talent badge (desktop, hover-specific)', () => {
  test.use({ viewport: DESKTOP.viewport, hasTouch: DESKTOP.hasTouch, isMobile: DESKTOP.isMobile })

  test('hovering the badge reveals the panel without clicking', async ({ page, backend }) => {
    seedIntTalents(backend, 2)
    await openCharacterSheet(page)
    await expandCard(page, 'INT')

    const badge = page.getByRole('button', { name: '2 talents liés à INT' })
    const panel = page.getByRole('group', { name: 'Talents liés à INT' })
    await expect(panel).toBeHidden()

    await badge.hover()

    await expect(panel).toBeVisible()
  })
})

test.describe('Characteristic talent badge (mobile, tap-specific)', () => {
  test.use({ viewport: MOBILE.viewport, hasTouch: MOBILE.hasTouch, isMobile: MOBILE.isMobile })

  test('tapping the badge toggles the panel and aria-expanded', async ({ page, backend }) => {
    seedIntTalents(backend, 2)
    await openCharacterSheet(page)
    await expandCard(page, 'INT')

    const badge = page.getByRole('button', { name: '2 talents liés à INT' })
    const panel = page.getByRole('group', { name: 'Talents liés à INT' })
    await expect(badge).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toBeHidden()

    await badge.tap()

    await expect(badge).toHaveAttribute('aria-expanded', 'true')
    await expect(panel).toBeVisible()

    await badge.tap()

    await expect(badge).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toBeHidden()
  })
})
