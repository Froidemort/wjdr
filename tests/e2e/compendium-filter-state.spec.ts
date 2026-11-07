import { expect, test } from '@playwright/test'

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

test('restores skill search, type and characteristic after navigation', async ({ page }) => {
  await page.route('**/rest/v1/skills*', (route) => route.fulfill(json([
    { id: 's1', name: 'Perception', specialization: null, is_basic: true, stat_code: 'Int', description: 'Observer', skills_talents: [] },
    { id: 's2', name: 'Baratin', specialization: null, is_basic: false, stat_code: 'Soc', description: null, skills_talents: [] },
  ])))
  await page.goto('/compendium/skills')
  await expect(page.getByText('2 compétence(s) trouvée(s)')).toBeVisible()
  await page.getByRole('searchbox').fill('perception')
  await page.getByRole('button', { name: 'De base', exact: true }).click()
  await page.getByRole('button', { name: 'Int (1)' }).click()

  await page.locator('a[href="/compendium"]').first().click()
  await expect(page).toHaveURL(/\/compendium$/)
  await page.goBack()

  await expect(page.getByRole('searchbox')).toHaveValue('perception')
  await expect(page.getByRole('button', { name: 'De base', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Int (1)' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('1 compétence(s) trouvée(s)')).toBeVisible()
  await page.getByRole('button', { name: /Réinitialiser/ }).click()
  await expect(page.getByText('2 compétence(s) trouvée(s)')).toBeVisible()
})

test('restores talent search and specialization after navigation', async ({ page }) => {
  await page.route('**/rest/v1/talents*', (route) => route.fulfill(json([
    { id: 't1', name: 'Savoir', specialization: 'magie', description: null, skills_talents: [] },
    { id: 't2', name: 'Acuité', specialization: null, description: null, skills_talents: [] },
  ])))
  await page.goto('/compendium/talents')
  await expect(page.getByText('2 talent(s) trouvé(s)')).toBeVisible()
  await page.getByRole('searchbox').fill('savoir')
  await page.getByLabel('Avec spécialisation uniquement').check()

  await page.locator('a[href="/compendium"]').first().click()
  await expect(page).toHaveURL(/\/compendium$/)
  await page.goBack()

  await expect(page.getByRole('searchbox')).toHaveValue('savoir')
  await expect(page.getByLabel('Avec spécialisation uniquement')).toBeChecked()
  await expect(page.getByText('1 talent(s) trouvé(s)')).toBeVisible()
  await page.getByRole('button', { name: /Réinitialiser/ }).click()
  await expect(page.getByText('2 talent(s) trouvé(s)')).toBeVisible()
})

test('restores career graph mode and selected destination after navigation', async ({ page }) => {
  await page.route('**/rest/v1/careers*', (route) => route.fulfill(json([
    { id: 'c1', name: 'Éclaireur' },
    { id: 'c2', name: 'Soldat' },
  ])))
  await page.route('**/rest/v1/career_paths*', (route) => route.fulfill(json([
    { from_career_id: 'c2', to_career_id: 'c1' },
  ])))
  await page.goto('/compendium/careers')
  await page.getByRole('button', { name: 'Vers', exact: true }).click()
  const destination = page.getByRole('group', { name: 'Arrivée' })
  await destination.getByRole('searchbox').fill('éclaireur')
  await destination.getByRole('button', { name: 'Éclaireur' }).click()

  await page.locator('a[href="/compendium"]').first().click()
  await expect(page).toHaveURL(/\/compendium$/)
  await page.goBack()

  await expect(page.getByRole('button', { name: 'Vers', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Retirer : Éclaireur' })).toBeVisible()
  await page.getByRole('button', { name: 'Réinitialiser' }).click()
  await expect(page.getByRole('button', { name: 'Retirer : Éclaireur' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Chemin', exact: true })).toHaveAttribute('aria-pressed', 'true')
})
