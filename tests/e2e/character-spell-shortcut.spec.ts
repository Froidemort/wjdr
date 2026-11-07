import { expect, test, E2E_CHARACTER_ID, E2E_USER_ID } from './fixtures/supabaseAuth'
import { spellShortcutKey } from '../../src/services/spellShortcutPreferencesRepository'

test('configure, restore and modify a character spell shortcut', async ({ page, backend }) => {
  test.setTimeout(90_000)
  backend.spells.push(
    { id: 1, name: 'Flamme', category: 'Feu', difficulty: 5, description: 'feu' },
    { id: 2, name: 'Éclair', category: 'Ciel', difficulty: 20, description: 'ciel' },
    { id: 3, name: 'Fer', category: 'Métal', difficulty: 35, description: 'métal' },
  )
  await page.goto(`/characters/${E2E_CHARACTER_ID}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Mes sorts' }).click()
  const dialog = page.getByRole('dialog', { name: 'Catégories de sorts' })
  await expect(dialog.getByRole('button', { name: 'Enregistrer et ouvrir' })).toBeDisabled()
  await dialog.getByLabel('Ciel', { exact: true }).check()
  await dialog.getByLabel('Métal', { exact: true }).check()
  await dialog.getByRole('button', { name: 'Enregistrer et ouvrir' }).click()
  await expect(page).toHaveURL(/\/compendium\/spells$/)
  await expect(page.getByText('2 sort(s) trouvé(s)')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Flamme' })).toBeHidden()
  await page.getByRole('searchbox').fill('absent')
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Mes sorts' }).click()
  await expect(page).toHaveURL(/\/compendium\/spells$/)
  await expect(page.getByRole('searchbox')).toHaveValue('')
  await expect(page.getByText('2 sort(s) trouvé(s)')).toBeVisible()
  await page.goto(`/characters/${E2E_CHARACTER_ID}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Configurer les catégories' }).click()
  await dialog.getByLabel('Feu', { exact: true }).check()
  await dialog.getByRole('button', { name: 'Annuler' }).click()
  await page.getByRole('button', { name: 'Mes sorts' }).click()
  await expect(page.getByText('2 sort(s) trouvé(s)')).toBeVisible()
})

test('requires removing unavailable categories before opening', async ({ page, backend }) => {
  backend.spells.push({ id: 1, name: 'Flamme', category: 'Feu', difficulty: 5, description: 'feu' })
  await page.addInitScript(({ key }) => localStorage.setItem(key, JSON.stringify(['Ancien', 'Feu'])), {
    key: spellShortcutKey(E2E_USER_ID, E2E_CHARACTER_ID),
  })
  await page.goto(`/characters/${E2E_CHARACTER_ID}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Mes sorts' }).click()
  const dialog = page.getByRole('dialog', { name: 'Catégories de sorts' })
  await expect(dialog.getByRole('alert')).toContainText('Catégories indisponibles')
  await expect(dialog.getByRole('button', { name: 'Enregistrer et ouvrir' })).toBeDisabled()
  await dialog.getByLabel('Ancien (retirer)').click()
  await dialog.getByRole('button', { name: 'Enregistrer et ouvrir' }).click()
  await expect(page.getByRole('heading', { name: 'Flamme' })).toBeVisible()
})

test('allows an explicit temporary selection when storage fails', async ({ page, backend }) => {
  backend.spells.push({ id: 1, name: 'Flamme', category: 'Feu', difficulty: 5, description: 'feu' })
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('wjdr:spell-shortcut:')) throw new Error('Storage unavailable')
      return setItem.call(this, key, value)
    }
  })
  await page.goto(`/characters/${E2E_CHARACTER_ID}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Mes sorts' }).click()
  const dialog = page.getByRole('dialog', { name: 'Catégories de sorts' })
  await dialog.getByLabel('Feu', { exact: true }).check()
  await dialog.getByRole('button', { name: 'Enregistrer et ouvrir' }).click()
  await expect(dialog.getByRole('alert')).toContainText('Enregistrement impossible')
  await dialog.getByRole('button', { name: 'Utiliser temporairement' }).click()
  await expect(page.getByRole('heading', { name: 'Flamme' })).toBeVisible()
})

test('reports spell loading errors and retries without navigating', async ({ page, backend }) => {
  backend.spellsFail = true
  backend.spells.push({ id: 1, name: 'Flamme', category: 'Feu', difficulty: 5, description: 'feu' })
  await page.goto(`/characters/${E2E_CHARACTER_ID}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Configurer les catégories' }).click()
  const dialog = page.getByRole('dialog', { name: 'Catégories de sorts' })
  await expect(dialog.getByRole('alert')).toContainText('Impossible de charger les sorts')
  await expect(page).toHaveURL(new RegExp(`/characters/${E2E_CHARACTER_ID}$`))
  backend.spellsFail = false
  await dialog.getByRole('button', { name: 'Réessayer' }).click()
  await expect(dialog.getByLabel('Feu')).toBeVisible()
})
