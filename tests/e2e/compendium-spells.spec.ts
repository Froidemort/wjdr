import { expect, test } from '@playwright/test'

const spell = (id: number, name: string, category: string, difficulty: number, description: string) => ({
  id,
  name,
  category,
  difficulty,
  casting_time: '1 action',
  range: '12 m',
  duration: 'Instantané',
  bonus_ingredient: null,
  bonus: null,
  description,
})

const spells = [
  spell(1, 'Boule de feu', 'Feu', 5, 'Projectile ardent.'),
  spell(2, 'Eclair', 'Ciel', 12, 'Foudre crepitante.'),
  spell(3, 'Dissipation', 'Metal', 35, 'Annule un sort.'),
]

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

test.describe('Compendium spells (public, read-only)', () => {
  test('lists spells and filters by search', async ({ page }) => {
    await page.route('**/rest/v1/spells*', (route) => route.fulfill(json(spells)))
    await page.goto('/compendium/spells', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Boule de feu' })).toBeVisible()
    await expect(page.getByText('3 sort(s) trouvé(s)')).toBeVisible()

    await page.getByRole('searchbox').fill('foudre')

    await expect(page.getByRole('heading', { name: 'Eclair' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Boule de feu' })).toBeHidden()
  })

  test('filters by category', async ({ page }) => {
    await page.route('**/rest/v1/spells*', (route) => route.fulfill(json(spells)))
    await page.goto('/compendium/spells', { waitUntil: 'domcontentloaded' })

    await page.getByRole('button', { name: /Collèges ou Divinités/ }).click()
    await page.locator('label', { hasText: 'Feu' }).getByRole('checkbox').check()

    await expect(page.getByText('1 sort(s) trouvé(s)')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Boule de feu' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Eclair' })).toBeHidden()
  })

  test('filters by difficulty range', async ({ page }) => {
    await page.route('**/rest/v1/spells*', (route) => route.fulfill(json(spells)))
    await page.goto('/compendium/spells', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('3 sort(s) trouvé(s)')).toBeVisible()

    await page.getByLabel('Max').fill('20')

    await expect(page.getByText('2 sort(s) trouvé(s)')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Dissipation' })).toBeHidden()
  })

  test('shows an error and retries', async ({ page }) => {
    let fail = true
    await page.route('**/rest/v1/spells*', (route) =>
      fail ? route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }) : route.fulfill(json(spells))
    )
    await page.goto('/compendium/spells', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('alert')).toBeVisible()

    fail = false
    await page.getByRole('button', { name: 'Réessayer' }).click()

    await expect(page.getByRole('heading', { name: 'Eclair' })).toBeVisible()
  })
})
