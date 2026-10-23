import { openCharacterSheet } from './fixtures/characterSheet'
import { expect, test } from './fixtures/supabaseAuth'

test.use({ viewport: { width: 375, height: 667 } })

test.describe('Character sheet (authenticated, mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await openCharacterSheet(page)
  })

  test('overview shows wounds, fortune and destiny before the other overview cards', async ({ page }) => {
    const wounds = page.getByRole('button', { name: 'Augmenter les points de blessures' })
    const fortune = page.getByRole('group', { name: 'Fortune: 2 sur 3' })
    const destiny = page.getByRole('group', { name: 'Destin: 1 sur 2' })
    const encumbrance = page.getByText('Encombrement', { exact: true })

    const tops = await Promise.all(
      [wounds, fortune, destiny, encumbrance].map(async (locator) => (await locator.boundingBox())?.y ?? Number.NaN)
    )

    expect(tops.every(Number.isFinite)).toBe(true)
    expect([...tops].sort((a, b) => a - b)).toEqual(tops)
  })

  test('quick-editing wounds persists with a PATCH', async ({ page, backend }) => {
    await page.getByRole('button', { name: 'Augmenter les points de blessures' }).click()

    await expect(page.getByRole('spinbutton', { name: 'Points de vie actuels' })).toHaveValue('9')
    await expect.poll(() => backend.patchesTo('characters').at(-1)?.body?.pv_current).toBe(9)
  })

  test('quick-editing fortune persists with a PATCH', async ({ page, backend }) => {
    await page.getByRole('button', { name: 'Fortune, point 3' }).click()

    await expect(page.getByRole('group', { name: 'Fortune: 3 sur 3' })).toBeVisible()
    await expect.poll(() => backend.patchesTo('characters').at(-1)?.body?.fortune_current).toBe(3)
  })

  test('equips then unequips armor through the doll', async ({ page, backend }) => {
    const bodySlot = page.getByRole('button', { name: /^Corps, vide/ })
    await bodySlot.click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Corps' })
    await dialog.getByRole('button', { name: /Cotte de mailles/ }).click()

    await expect.poll(() => backend.patchesTo('character_armors').at(-1)?.body).toEqual({ is_equipped: true })
    await expect(page.getByRole('button', { name: /^Corps, équipé : Cotte de mailles/ })).toBeVisible()

    await dialog.getByRole('button', { name: /Cotte de mailles/ }).click()

    await expect.poll(() => backend.patchesTo('character_armors').at(-1)?.body).toEqual({ is_equipped: false })
    await expect(page.getByRole('button', { name: /^Corps, vide/ })).toBeVisible()
  })

  test('a failing action shows a dismissible error on the loaded sheet', async ({ page, backend }) => {
    await page.route('**/rest/v1/character_armors*', (route) =>
      route.request().method() === 'PATCH'
        ? route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ code: '42501', message: 'denied', details: '', hint: null }),
          })
        : route.fallback()
    )

    await page.getByRole('button', { name: /^Corps, vide/ }).click()
    await page.getByRole('dialog').filter({ hasText: 'Corps' }).getByRole('button', { name: /Cotte de mailles/ }).click()

    const alert = page.getByRole('alert').filter({ hasText: 'Modification impossible.' })
    await expect(alert).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Aperçu' })).toBeVisible()
    expect(backend.patchesTo('character_armors')).toHaveLength(0)

    await page.keyboard.press('Escape')
    await alert.getByRole('button', { name: "Fermer le message d'erreur" }).click()

    await expect(alert).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Aperçu' })).toBeVisible()
  })

  test('shows the sync status and fits a 320px viewport without horizontal scroll', async ({ page }) => {
    await expect(page.getByTestId('sync-status')).toContainText('Enregistré')

    await page.setViewportSize({ width: 320, height: 640 })

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('a failed save shows the error state with a retry action', async ({ page }) => {
    await page.route('**/rest/v1/characters*', (route) =>
      route.request().method() === 'PATCH'
        ? route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ code: '42501', message: 'denied', details: '', hint: null }),
          })
        : route.fallback()
    )

    await page.getByRole('button', { name: 'Augmenter les points de blessures' }).click()

    const status = page.getByTestId('sync-status')
    await expect(status).toContainText('Erreur de sauvegarde')
    await expect(status.getByRole('button', { name: 'Réessayer' })).toBeVisible()
  })

  test('add and career-edit buttons are disabled offline', async ({ page, context, backend }) => {
    const careerEdit = page.getByRole('button', { name: 'Modifier la carrière' })
    await expect(careerEdit).toBeEnabled()

    backend.offline = true
    await context.setOffline(true)

    await expect(careerEdit).toBeDisabled()
    for (const [tab, addLabels] of [
      ['Compétences', ['Ajouter des compétences', 'Ajouter des talents']],
      ['Inventaire', ['Ajouter des armes', 'Ajouter des armures', 'Ajouter des équipements']],
    ] as const) {
      await page.getByRole('tab', { name: tab }).click()
      for (const label of addLabels) {
        const group = label.replace('Ajouter des ', '')
        const summary = page.getByText(new RegExp(`^${group}`, 'i')).first()
        if ((await page.getByRole('button', { name: label }).count()) === 0) {
          await summary.click()
        }
        await expect(page.getByRole('button', { name: label })).toBeDisabled()
      }
    }

    backend.offline = false
    await context.setOffline(false)

    await expect(careerEdit).toBeEnabled()
  })

  test('a stat tick made offline is queued then replayed on reconnect', async ({ page, context, backend }) => {
    await page.getByTestId('character-stat-view-mode').click()
    const tickUp = page.getByRole('article').filter({ hasText: 'Valeur totale' }).filter({ has: page.getByRole('heading', { name: 'F', exact: true }) }).getByRole('button', { name: "Augmenter l'avancement" })

    backend.offline = true
    await context.setOffline(true)
    await tickUp.click()

    await expect(page.getByText('Hors ligne: 1 modification en attente.')).toBeVisible()
    expect(backend.patchesTo('character_stat_values')).toHaveLength(0)

    backend.offline = false
    await context.setOffline(false)

    await expect.poll(() => backend.patchesTo('character_stat_values').at(-1)?.body).toEqual({ current_advanced: 5 })
    await expect(page.getByText(/modification.* en attente/)).toBeHidden()
  })
})
