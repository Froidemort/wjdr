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
  test('1) App shell semantics, skip link, dialog labelling and focus return', async ({ page }) => {
    await page.goto('/')

    const skipLink = page.getByRole('link', { name: 'Aller au contenu principal' })
    await expect(skipLink).toHaveCount(1)

    await page.keyboard.press('Tab')
    await expect(skipLink).toBeVisible()

    await expect(page.locator('header')).toHaveCount(1)
    await expect(page.locator('main#main-content')).toHaveCount(1)
    await expect(page.locator('header nav')).toHaveCount(1)
    await expect(page.locator('nav')).toHaveCount(2)

    const loginTrigger = page.getByRole('button', { name: 'Se connecter' }).first()
    await expect(loginTrigger).toBeVisible()

    await loginTrigger.click()

    const dialog = page.locator('dialog.modal[aria-labelledby]').first()
    await expect(dialog).toBeVisible()

    const labelledBy = await dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()

    const titleLocator = page.locator(`#${labelledBy}`)
    await expect(titleLocator).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()

    await expect
      .poll(async () => loginTrigger.evaluate((element) => document.activeElement === element), {
        timeout: 3000,
      })
      .toBe(true)

    await page.screenshot({
      path: screenshotPath('01-app-shell-and-modal-focus.png'),
      fullPage: true,
    })
  })

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

  test('3) Forms: native submit event + disabled feedback during submit', async ({ page }) => {
    let tokenRequestCount = 0

    await page.route('**/auth/v1/token?*', async (route) => {
      tokenRequestCount += 1
      await new Promise((resolve) => setTimeout(resolve, 700))
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
      })
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Se connecter' }).first().click()

    const dialog = page.locator('dialog.modal').first()
    await expect(dialog).toBeVisible()

    const authForm = dialog.locator('form').first()
    await expect(authForm).toHaveCount(1)

    const textInput = dialog.locator('input[type="text"]').first()
    const passwordInput = dialog.locator('input[type="password"]').first()

    await expect(textInput).toBeVisible()
    await expect(passwordInput).toBeVisible()

    // Use an email-like identifier to bypass username->email RPC lookup and hit auth token endpoint directly.
    await textInput.fill('demo@example.com')
    await passwordInput.fill('invalid-password')

    const submitButton = dialog.getByRole('button', { name: 'Se connecter' })
    await passwordInput.press('Enter')

    await expect.poll(() => tokenRequestCount, { timeout: 5000 }).toBeGreaterThan(0)
    await expect(submitButton).toBeDisabled()

    await expect(dialog.getByRole('alert')).toBeVisible({ timeout: 10000 })
    await expect(submitButton).toBeEnabled()

    await page.screenshot({
      path: screenshotPath('03-form-submit-feedback-auth-modal.png'),
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
})
