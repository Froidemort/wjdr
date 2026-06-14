import { expect, test } from '@playwright/test'

const setIonInputValue = async (
  page: import('@playwright/test').Page,
  selector: string,
  value: string
): Promise<void> => {
  await page.locator(selector).evaluate((el, nextValue) => {
    const ionInput = el as HTMLElement & { value?: string | number | null }
    ionInput.value = nextValue
    ionInput.dispatchEvent(
      new CustomEvent('ionInput', {
        bubbles: true,
        composed: true,
        detail: { value: nextValue }
      })
    )
    ionInput.dispatchEvent(
      new CustomEvent('ionChange', {
        bubbles: true,
        composed: true,
        detail: { value: nextValue }
      })
    )
  }, value)
}

const setIonSelectValue = async (
  page: import('@playwright/test').Page,
  selector: string,
  value: string | number | null
): Promise<void> => {
  await page.locator(selector).evaluate((el, nextValue) => {
    const ionSelect = el as HTMLElement & { value?: string | null }
    ionSelect.value = nextValue
    ionSelect.dispatchEvent(
      new CustomEvent('ionChange', {
        bubbles: true,
        composed: true,
        detail: { value: nextValue }
      })
    )
  }, value)
}

test('M1 flow: create, reopen, edit resources, export json', async ({ page }) => {
  const uniqueName = `Konrad-${Date.now()}`

  await page.goto('/')

  await setIonInputValue(page, '[data-testid="character-name-input"]', uniqueName)
  await page.getByTestId('create-character-button').click()

  await expect(page).toHaveURL(/\/character\//)
  await expect(page.getByText(uniqueName)).toBeVisible()
  await expect(page.getByTestId('wounds-value')).toHaveText('10 / 10')

  await page.getByTestId('wounds-minus').click()
  await expect(page.getByTestId('wounds-value')).toHaveText('9 / 10')

  await setIonInputValue(page, '[data-testid="wounds-current-input"]', '8')
  await setIonInputValue(page, '[data-testid="wounds-max-input"]', '10')
  await page.getByTestId('wounds-save').click()
  await expect(page.getByTestId('wounds-value')).toHaveText('8 / 10')

  await page.getByTestId('fortune-minus').click()
  await expect(page.getByTestId('fortune-value')).toHaveText('1 / 2')
  await page.getByTestId('fortune-plus').click()
  await expect(page.getByTestId('fortune-value')).toHaveText('2 / 2')
  await setIonInputValue(page, '[data-testid="fortune-current-input"]', '4')
  await setIonInputValue(page, '[data-testid="fortune-max-input"]', '4')
  await page.getByTestId('fortune-save').click()
  await expect(page.getByTestId('fortune-value')).toHaveText('4 / 4')

  await page.getByTestId('fate-minus').click()
  await expect(page.getByTestId('fate-value')).toHaveText('0 / 1')
  await page.getByTestId('fate-plus').click()
  await expect(page.getByTestId('fate-value')).toHaveText('1 / 1')
  await setIonInputValue(page, '[data-testid="fate-current-input"]', '3')
  await setIonInputValue(page, '[data-testid="fate-max-input"]', '3')
  await page.getByTestId('fate-save').click()
  await expect(page.getByTestId('fate-value')).toHaveText('3 / 3')

  await setIonInputValue(page, '[data-testid="money-edit-co-input"]', '0')
  await setIonInputValue(page, '[data-testid="money-edit-pa-input"]', '25')
  await setIonInputValue(page, '[data-testid="money-edit-s-input"]', '15')
  await page.getByTestId('money-save-button').click()
  await expect(page.getByTestId('money-value')).toHaveText('1 co / 6 pa / 3 s')

  await page.getByTestId('open-editor-button').click()
  await expect(page).toHaveURL(/\/edit$/)

  await page.getByTestId('section-careers-header').click()
  await setIonSelectValue(page, '[data-testid="edit-race-input"]', 'elf')
  await setIonSelectValue(page, '[data-testid="edit-current-career-input"]', 'Apprenti Sorcier')
  await setIonSelectValue(page, '[data-testid="edit-previous-career-input"]', 'Fanatique')
  await page.getByTestId('add-previous-career-button').click()

  await page.getByTestId('section-abilities-header').click()
  await setIonSelectValue(page, '[data-testid="edit-skill-input"]', 'language-reikspiel')
  await page.getByTestId('add-skill-button').click()
  await setIonSelectValue(page, '[data-testid="edit-skill-mastery-0"]', 10)
  await setIonSelectValue(page, '[data-testid="edit-talent-input"]', 'sixth-sense')
  await page.getByTestId('add-talent-button').click()

  await page.getByTestId('section-characteristics-header').click()
  await setIonInputValue(page, '[data-testid="edit-actions-input"]', '2')
  await setIonInputValue(page, '[data-testid="edit-actions-ticks-input"]', '1')
  await setIonInputValue(page, '[data-testid="edit-magic-input"]', '1')
  await setIonInputValue(page, '[data-testid="edit-magic-ticks-input"]', '2')
  await setIonInputValue(page, '[data-testid="edit-bf-ticks-input"]', '1')
  await setIonInputValue(page, '[data-testid="edit-cc-base-input"]', '42')
  await setIonInputValue(page, '[data-testid="edit-cc-advance-input"]', '8')
  await setIonInputValue(page, '[data-testid="edit-cc-ticks-input"]', '2')

  await page.getByTestId('save-editor-button').click()
  await expect(page).not.toHaveURL(/\/edit$/)

  await expect(page.getByTestId('wounds-value')).toHaveText('8 / 10')
  await expect(page.getByTestId('fortune-value')).toHaveText('4 / 4')
  await expect(page.getByTestId('fate-value')).toHaveText('3 / 3')
  await expect(page.getByTestId('money-value')).toHaveText('1 co / 6 pa / 3 s')
  await expect(page.getByTestId('experience-total-value')).toHaveText('0')
  await expect(page.getByTestId('experience-spent-value')).toHaveText('0')
  await expect(page.getByTestId('experience-available-value')).toHaveText('0')
  await expect(page.getByTestId('character-race-icon')).toHaveText('🏹')
  await expect(page.getByTestId('character-race-value')).toHaveText('🏹 Elfe')
  await expect(page.getByTestId('character-current-career-value')).toHaveText('Apprenti Sorcier')
  await expect(page.getByTestId('character-previous-career-0')).toHaveText('Fanatique')
  await expect(page.getByTestId('character-skill-0')).toHaveText('Langue (reikspiel) - +10%')
  await expect(page.getByTestId('character-talent-0')).toHaveText('Sixième sens')
  await expect(page.getByTestId('character-cc-value')).toHaveText('52%')
  await expect(page.getByTestId('character-actions-value')).toHaveText('3')
  await expect(page.getByTestId('character-magic-value')).toHaveText('3')
  await expect(page.getByTestId('character-bf-value')).toHaveText('4')

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('export-json-button').click()
  const download = await downloadPromise

  const filePath = await download.path()
  expect(filePath).toBeTruthy()

  await page.goto('/')
  await expect(page.getByText(uniqueName)).toBeVisible()

  await page.locator('[data-testid="import-json-input"]').setInputFiles(filePath!)

  await expect(page).toHaveURL(/\/character\//)
  await expect(page.getByRole('button', { name: 'Exporter' })).toBeVisible()
  await expect(page.getByTestId('money-value')).toHaveText('1 co / 6 pa / 3 s')
  await expect(page.getByTestId('experience-total-value')).toHaveText('0')
  await expect(page.getByTestId('character-race-icon')).toHaveText('🏹')
  await expect(page.getByTestId('character-race-value')).toHaveText('🏹 Elfe')
  await expect(page.getByTestId('character-current-career-value')).toHaveText('Apprenti Sorcier')
  await expect(page.getByTestId('character-previous-career-0')).toHaveText('Fanatique')
  await expect(page.getByTestId('character-skill-0')).toHaveText('Langue (reikspiel) - +10%')
  await expect(page.getByTestId('character-talent-0')).toHaveText('Sixième sens')
  await expect(page.getByTestId('character-cc-value')).toHaveText('52%')
  await expect(page.getByTestId('character-actions-value')).toHaveText('3')
  await expect(page.getByTestId('character-magic-value')).toHaveText('3')
  await expect(page.getByTestId('character-bf-value')).toHaveText('4')

  // Verify main characteristics section is displayed
  const mainCharacteristicsCard = page.getByRole('heading', { name: 'Caractéristiques Principales' })
  await expect(mainCharacteristicsCard).toBeVisible()

  // Verify secondary characteristics section is displayed
  const secondaryCharacteristicsCard = page.getByRole('heading', { name: 'Caractéristiques Secondaires' })
  await expect(secondaryCharacteristicsCard).toBeVisible()

  // Verify we can see characteristic labels in the page
  await expect(page.locator('text=Attaques (A)')).toBeVisible()
  await expect(page.locator('text=Mouvement (M)')).toBeVisible()

  await page.goto('/')
  const createdRow = page
    .locator('ion-item[data-testid^="character-row-"]')
    .filter({ hasText: uniqueName })
    .first()

  await expect(createdRow.locator('[data-testid^="character-race-icon-"]')).toHaveText('🏹')
  await expect(createdRow.locator('[data-testid^="character-race-value-"]')).toHaveText('Elfe')
})
