import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

type RequestCounter = Map<string, number>

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'tests/e2e/screenshots')

function ensureScreenshotDir(): void {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

function screenshotPath(name: string): string {
  return path.join(SCREENSHOT_DIR, name)
}

function incrementCounter(counter: RequestCounter, key: string): void {
  counter.set(key, (counter.get(key) ?? 0) + 1)
}

function normalizeRestPath(url: string): string {
  const parsed = new URL(url)
  return `${parsed.pathname}${parsed.search}`
}

test.beforeAll(() => {
  ensureScreenshotDir()
})

test.describe('UI/UX audit - app shell, a11y, performance and visual diagnostics', () => {
  test('2) Navbar reactive states, ARIA state and mobile touch targets', async ({ page }) => {
    await page.goto('/')

    const notificationsButton = page.getByRole('button', { name: 'Notifications' })
    if (await notificationsButton.count()) {
      await expect(notificationsButton).toHaveAttribute('aria-expanded', 'false')
      await notificationsButton.click()
      await expect(notificationsButton).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press('Escape')
      await expect(notificationsButton).toHaveAttribute('aria-expanded', 'false')
    } else {
      test.info().annotations.push({
        type: 'note',
        description:
          'Notification center not rendered in anonymous state. Run the same test with an authenticated user to validate expanded/collapsed behavior.',
      })
    }

    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()

    const actionButtons = page.locator('nav .btn-square:visible')
    const buttonCount = await actionButtons.count()

    if (buttonCount === 0) {
      test.info().annotations.push({
        type: 'note',
        description:
          'No square navbar action button visible on current state. Mobile touch target validation should be rerun with an authenticated user.',
      })
    }

    for (let index = 0; index < buttonCount; index += 1) {
      const box = await actionButtons.nth(index).boundingBox()
      expect(box, `Missing boundingBox on navbar action button #${index + 1}`).not.toBeNull()
      expect(
        box!.width,
        `Navbar action button #${index + 1} width should be >= 44px`
      ).toBeGreaterThanOrEqual(44)
      expect(
        box!.height,
        `Navbar action button #${index + 1} height should be >= 44px`
      ).toBeGreaterThanOrEqual(44)
    }

    await page.screenshot({
      path: screenshotPath('02-navbar-mobile-touch-targets.png'),
      fullPage: true,
    })
  })

  test('4) Character detail visual tokens and responsive overflow audit', async ({ page }) => {
    await page.goto('/characters/dummy-audit-id')

    const toastAlert = page.locator('.toast .alert').first()
    if (await toastAlert.count()) {
      const className = (await toastAlert.getAttribute('class')) ?? ''
      expect(
        className.includes('text-error-content') || className.includes('text-warning-content')
      ).toBeTruthy()
    } else {
      test.info().annotations.push({
        type: 'note',
        description:
          'Toast area not visible for the current route state. Validate toast semantic color classes while triggering a real save/error event in authenticated mode.',
      })
    }

    const desktopOverflow = await page.evaluate(() => {
      const target = document.querySelector('main#main-content') as HTMLElement | null
      if (!target) {
        return true
      }
      return target.scrollWidth === target.clientWidth
    })
    expect(desktopOverflow).toBeTruthy()

    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()

    const mobileOverflow = await page.evaluate(() => {
      const target = document.querySelector('main#main-content') as HTMLElement | null
      if (!target) {
        return true
      }
      return target.scrollWidth === target.clientWidth
    })
    expect(mobileOverflow).toBeTruthy()

    await page.screenshot({
      path: screenshotPath('04-character-detail-mobile-overflow-audit.png'),
      fullPage: true,
    })

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.reload()
    await page.screenshot({
      path: screenshotPath('04-character-detail-desktop-overflow-audit.png'),
      fullPage: true,
    })
  })

  test('5) Network stability audit: detect duplicate fetches on list/detail mounts', async ({
    page,
  }) => {
    const restCounts: RequestCounter = new Map()

    await page.route('**/rest/v1/**', async (route) => {
      const key = normalizeRestPath(route.request().url())
      incrementCounter(restCounts, key)
      await route.continue()
    })

    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')

    const sessionsPath = page.url()
    if (sessionsPath.endsWith('/sessions')) {
      const repeatedListCalls = Array.from(restCounts.entries()).filter(([requestPath, count]) => {
        return requestPath.includes('/sessions') && count > 1
      })
      expect(
        repeatedListCalls,
        `Duplicate list fetches detected: ${JSON.stringify(repeatedListCalls)}`
      ).toEqual([])
    } else {
      test.info().annotations.push({
        type: 'note',
        description:
          'Sessions list not reachable in current auth state; duplicate fetch assertion for list view skipped.',
      })
    }

    await page.goto('/sessions/dummy-audit-id')
    await page.waitForLoadState('networkidle')

    const sessionDetailPath = page.url()
    if (sessionDetailPath.includes('/sessions/dummy-audit-id')) {
      const repeatedDetailCalls = Array.from(restCounts.entries()).filter(
        ([requestPath, count]) => {
          return requestPath.includes('/sessions') && count > 1
        }
      )
      expect(
        repeatedDetailCalls,
        `Duplicate detail fetches detected: ${JSON.stringify(repeatedDetailCalls)}`
      ).toEqual([])
    } else {
      test.info().annotations.push({
        type: 'note',
        description:
          'Session detail not reachable in current auth state; duplicate fetch assertion for detail view skipped.',
      })
    }

    await page.screenshot({
      path: screenshotPath('05-network-stability-route-state.png'),
      fullPage: true,
    })
  })

  test('6) Diagnostic screenshots index capture', async ({ page }) => {
    await page.goto('/')
    await page.screenshot({
      path: screenshotPath('06-home-diagnostic-fullpage.png'),
      fullPage: true,
    })
  })

  test('7) New responsive filters and search guidance (character/campaign views)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 })

    await page.goto('/characters')
    await page.waitForLoadState('networkidle')

    const raceFilters = page.locator('button', { hasText: 'Toutes races' })
    if (await raceFilters.count()) {
      const allRaceButton = raceFilters.first()
      const box = await allRaceButton.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(40)
    } else {
      test.info().annotations.push({
        type: 'note',
        description:
          'Character list filter controls are not visible in current auth state. Re-run authenticated to validate interactive filtering.',
      })
    }

    await page.goto('/characters/dummy-audit-id')
    await page.waitForLoadState('networkidle')

    const equipmentFilterButton = page.getByRole('button', { name: 'Normal' }).first()
    if (await equipmentFilterButton.count()) {
      const box = await equipmentFilterButton.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(40)
    } else {
      test.info().annotations.push({
        type: 'note',
        description:
          'Character detail equipment filters not rendered for current route state. Re-run with a valid character id to validate filter UX.',
      })
    }

    await page.goto('/campaigns/dummy-audit-id')
    await page.waitForLoadState('networkidle')

    const inviteSearchHint = page.getByText('Entrez au moins 2 caracteres pour rechercher un joueur.')
    if (await inviteSearchHint.count()) {
      await expect(inviteSearchHint.first()).toBeVisible()
    } else {
      test.info().annotations.push({
        type: 'note',
        description:
          'Campaign invitation search guidance not visible in current auth state. Re-run with MJ access to validate invitation UX hints.',
      })
    }

    await page.screenshot({
      path: screenshotPath('07-responsive-filters-and-guidance.png'),
      fullPage: true,
    })
  })
})
