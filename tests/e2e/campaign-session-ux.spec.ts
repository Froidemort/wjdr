import { getCampaignSessionTodayKey } from '../../src/utils/campaignSessions'
import { E2E_CAMPAIGN_ID, E2E_USER_ID, expect, test } from './fixtures/supabaseAuth'

async function waitForSplashGone(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('html.app-splash-active')).toHaveCount(0)
}

test.describe('Campaign sessions (player, mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(({ backend }) => {
    backend.campaign.mj_id = 'mj-e2e-other'
    backend.sessions.push({
      id: 'session-today',
      campaign_id: E2E_CAMPAIGN_ID,
      date: getCampaignSessionTodayKey(),
      name: 'Session du jour',
      description: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    })
  })

  test('takes a markdown note from the next-session hero and sees it rendered', async ({ page }) => {
    await page.goto(`/campaigns/${E2E_CAMPAIGN_ID}`, { waitUntil: 'domcontentloaded' })
    await waitForSplashGone(page)

    await expect(page.getByTestId('next-session-hero')).toBeVisible()
    await expect(page.getByTestId('next-session-today-badge')).toHaveText("Aujourd'hui")

    await page.getByRole('button', { name: 'Prendre une note' }).click()
    await page.getByRole('button', { name: 'Ajouter une note' }).click()

    const dialog = page.getByRole('dialog')
    await dialog
      .getByRole('textbox', { name: 'Contenu texte' })
      .fill('**gras**\n\n- item un\n- item deux')
    await dialog.getByRole('button', { name: 'Créer la note' }).click()

    await expect(dialog).toBeHidden()

    const noteCard = page.locator('article.bg-base-200').filter({ hasText: 'item un' })
    await expect(noteCard.locator('strong', { hasText: 'gras' })).toBeVisible()
    await expect(noteCard.locator('li', { hasText: 'item deux' })).toBeVisible()
  })
})

test.describe('Campaign sessions (MJ, desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(({ backend }) => {
    backend.campaign.mj_id = E2E_USER_ID
  })

  test('creates a session from the side panel with Ctrl+Enter', async ({ page }) => {
    await page.goto(`/campaigns/${E2E_CAMPAIGN_ID}`, { waitUntil: 'domcontentloaded' })
    await waitForSplashGone(page)

    await page.getByRole('tab', { name: 'Sessions' }).click()
    await page.getByRole('button', { name: 'Nouvelle session' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: 'Nouvelle session' })
    await expect(dialog.getByLabel('Date')).toHaveValue(getCampaignSessionTodayKey())

    await dialog.getByLabel('Titre optionnel').fill('Session Playwright')
    await page.keyboard.press('Control+Enter')

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Session Playwright' })).toBeVisible()
  })
})

test.describe('Campaign notes (player, desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(({ backend }) => {
    backend.campaign.mj_id = 'mj-e2e-other'
  })

  test('keeps an unsaved note draft after a reload', async ({ page }) => {
    await page.goto(`/campaigns/${E2E_CAMPAIGN_ID}?tab=notes`, { waitUntil: 'domcontentloaded' })
    await waitForSplashGone(page)

    const content = page.getByRole('textbox', { name: 'Contenu texte' })
    await content.fill('Brouillon **important**')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForSplashGone(page)

    await expect(page.getByRole('textbox', { name: 'Contenu texte' })).toHaveValue(
      'Brouillon **important**'
    )
  })

  test('sanitizes script tags and javascript: links in note content', async ({ page }) => {
    await page.goto(`/campaigns/${E2E_CAMPAIGN_ID}?tab=notes`, { waitUntil: 'domcontentloaded' })
    await waitForSplashGone(page)

    await page
      .getByRole('textbox', { name: 'Contenu texte' })
      .fill('Texte avant <script>alert(1)</script> texte après et [lien](javascript:alert(1))')
    await page.getByRole('button', { name: 'Créer la note' }).click()

    const noteCard = page.locator('article.bg-base-200').filter({ hasText: 'Texte avant' })
    await expect(noteCard).toBeVisible()
    await expect(noteCard.locator('script')).toHaveCount(0)
    await expect(noteCard.locator('a[href^="javascript:"]')).toHaveCount(0)
    await expect(noteCard).toContainText('texte après')
  })
})
