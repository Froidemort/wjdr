import { expect, test } from '@playwright/test'

const skills = [
  {
    id: 'skill-acrobatics',
    name: 'Acrobatie',
    specialization: null,
    is_basic: true,
    stat_code: 'AG',
    description: 'Garder son équilibre et esquiver les coups.',
    skills_talents: [
      { talents: { id: 'talent-reflexes', name: 'Reflexes vifs', specialization: null } },
    ],
  },
  {
    id: 'skill-lore',
    name: 'Connaissances',
    specialization: null,
    is_basic: false,
    stat_code: 'INT',
    description: 'Se souvenir des faits utiles.',
    skills_talents: [],
  },
]

const talents = [
  {
    id: 'talent-reflexes',
    name: 'Reflexes vifs',
    specialization: null,
    description: 'Réagir avant le danger.',
    skills_talents: [
      { skills: { id: 'skill-acrobatics', name: 'Acrobatie', specialization: null } },
    ],
  },
]

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/skills**', (route) => route.fulfill({ json: skills }))
  await page.route('**/rest/v1/talents**', (route) => route.fulfill({ json: talents }))
})

test.describe('Public skills and talents compendium', () => {
  test('searches skills and follows related talent and skill links', async ({ page }) => {
    await page.goto('/compendium/skills')

    await page.getByRole('searchbox').fill('acro')
    const skillCard = page.getByRole('button', { name: /Acrobatie/ })
    await expect(skillCard).toBeVisible()
    await expect(page.getByRole('button', { name: /Connaissances/ })).toHaveCount(0)
    await skillCard.click()

    const skillDialog = page.getByRole('dialog', { name: 'Acrobatie' })
    await expect(skillDialog.getByText('Garder son équilibre et esquiver les coups.')).toBeVisible()
    await skillDialog.getByRole('link', { name: 'Reflexes vifs' }).click()

    await expect(page).toHaveURL(/\/compendium\/talents\?entry=reflexes-vifs$/)
    const talentDialog = page.getByRole('dialog', { name: 'Reflexes vifs' })
    await expect(talentDialog.getByText('Réagir avant le danger.')).toBeVisible()
    await talentDialog.getByRole('link', { name: 'Acrobatie' }).click()

    await expect(page).toHaveURL(/\/compendium\/skills\?entry=acrobaties?$/)
    await expect(page.getByRole('dialog', { name: 'Acrobatie' })).toBeVisible()
  })
})

test.describe('Interactive map', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/map_marker_types**', (route) => route.fulfill({ json: [] }))
    await page.route('**/rest/v1/map_markers**', (route) => route.fulfill({ json: [] }))
    await page.route('**/data/cities.json', (route) =>
      route.fulfill({
        json: [{ id: 1, name: 'Altdorf', lat: 48.1, lng: 11.5, type: 'Cité', population: 105000, region: 'Reikland', hidden: false }],
      })
    )
    await page.route('**/storage/v1/object/**/map-tiles/**', (route) => route.fulfill({ status: 401, json: { message: 'unauthorized' } }))
  })

  test('signed-out visitors are asked to sign in for the base map', async ({ page }) => {
    await page.goto('/map')

    await expect(page.getByRole('application', { name: 'Carte du Vieux Monde' })).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'Connecte-toi pour afficher le fond de carte' })).toBeVisible()
  })

  test('shows the cities toggle and offline prefetch in the layer panel', async ({ page }) => {
    await page.goto('/map')

    await expect(page.getByLabel('Points d\'intérêt')).toBeChecked()
    await expect(page.getByRole('button', { name: /Précharger la carte/ })).toBeVisible()
  })
})
