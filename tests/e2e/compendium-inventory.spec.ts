import { expect, test } from '@playwright/test'

const weapons = [
  {
    id: 'w1',
    name: 'Epee',
    description: 'Lame courte.',
    encumbrance: 100,
    damage_formula: 'BF+4',
    weapon_attribute_mappings: [{ weapon_attributes: { name: 'Parade', description: null } }],
  },
  { id: 'w2', name: 'Arc court', description: null, encumbrance: 50, damage_formula: 'BF+3', weapon_attribute_mappings: [] },
]
const armors = [
  { id: 'a1', name: 'Cotte de mailles', description: null, encumbrance: 200, armor_points: 2, category: 'maille', covered_locations: ['corps'] },
]
const items = [{ id: 'i1', name: 'Corde', description: null, encumbrance: 10 }]

test.describe('Compendium inventory (public, read-only)', () => {
  test.beforeEach(async ({ page }) => {
    const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    await page.route('**/rest/v1/weapons*', (route) => route.fulfill(json(weapons)))
    await page.route('**/rest/v1/armors*', (route) => route.fulfill(json(armors)))
    await page.route('**/rest/v1/items*', (route) => route.fulfill(json(items)))
    await page.goto('/compendium/inventory')
  })

  test('shows weapons with their damage formula and filters by search', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Epee' })).toBeVisible()
    await expect(page.getByText('BF+4')).toBeVisible()

    await page.getByRole('searchbox').fill('arc')

    await expect(page.getByRole('heading', { name: 'Epee' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Arc court' })).toBeVisible()
  })

  test('switches tabs', async ({ page }) => {
    await page.getByRole('tab', { name: 'Armures' }).click()
    await expect(page.getByRole('heading', { name: 'Cotte de mailles' })).toBeVisible()

    await page.getByRole('tab', { name: 'Équipements' }).click()
    await expect(page.getByRole('heading', { name: 'Corde' })).toBeVisible()
  })

  test('exposes no edit control', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Epee' })).toBeVisible()
    await expect(page.getByRole('button', { name: /ajouter|supprimer|modifier|équiper/i })).toHaveCount(0)
  })

  test('restores independent tab filters after navigation and keeps a reset', async ({ page }) => {
    await page.getByRole('searchbox').fill('arc')
    await expect(page.getByRole('heading', { name: 'Arc court' })).toBeVisible()
    await page.getByRole('tab', { name: 'Armures' }).click()
    await page.getByRole('searchbox').fill('maille')
    await expect(page.getByRole('heading', { name: 'Cotte de mailles' })).toBeVisible()

    await page.locator('a[href="/compendium"]').first().click()
    await expect(page).toHaveURL(/\/compendium$/)
    await page.goBack()

    await expect(page.getByRole('tab', { name: 'Armures' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('searchbox')).toHaveValue('maille')
    await page.getByRole('tab', { name: 'Armes' }).click()
    await expect(page.getByRole('searchbox')).toHaveValue('arc')
    await expect(page.getByRole('heading', { name: 'Epee' })).toBeHidden()
    await page.getByRole('button', { name: /Réinitialiser/ }).click()
    await page.locator('a[href="/compendium"]').first().click()
    await expect(page).toHaveURL(/\/compendium$/)
    await page.goBack()
    await expect(page.getByRole('searchbox')).toHaveValue('')
    await expect(page.getByRole('heading', { name: 'Epee' })).toBeVisible()
  })
})
