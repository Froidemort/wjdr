import { E2E_CHARACTER_ID, expect, test } from './fixtures/supabaseAuth'

test.use({ viewport: { width: 375, height: 667 } })

test.describe('Character sheet (authenticated, mobile)', () => {
  test.beforeEach(async ({ page, backend }) => {
    void backend
    await page.goto(`/characters/${E2E_CHARACTER_ID}`)
    await expect(page.getByRole('heading', { name: 'Aperçu' })).toBeVisible()
    await expect(page.locator('html.app-splash-active')).toHaveCount(0)
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

  test('a stat tick made offline is queued then replayed on reconnect', async ({ page, context, backend }) => {
    await page.getByRole('button', { name: /Etat actuel: Compact/ }).click()
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
