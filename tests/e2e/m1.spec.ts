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

  await page.getByTestId('fortune-plus').click()
  await expect(page.getByTestId('fortune-value')).toHaveText('3')

  await page.getByTestId('fate-plus').click()
  await expect(page.getByTestId('fate-value')).toHaveText('2')

  await page.getByTestId('open-editor-button').click()
  await expect(page).toHaveURL(/\/edit$/)

  await setIonInputValue(page, '[data-testid="edit-wounds-current-input"]', '8')
  await setIonInputValue(page, '[data-testid="edit-fortune-input"]', '4')
  await setIonInputValue(page, '[data-testid="edit-fate-input"]', '3')
  await setIonInputValue(page, '[data-testid="edit-money-co-input"]', '0')
  await setIonInputValue(page, '[data-testid="edit-money-pa-input"]', '40')
  await setIonInputValue(page, '[data-testid="edit-money-s-input"]', '15')

  await page.getByTestId('save-editor-button').click()
  await expect(page).not.toHaveURL(/\/edit$/)

  await expect(page.getByTestId('wounds-value')).toHaveText('8 / 10')
  await expect(page.getByTestId('fortune-value')).toHaveText('4')
  await expect(page.getByTestId('fate-value')).toHaveText('3')
  await expect(page.getByTestId('money-value')).toHaveText('2 co / 1 pa / 3 s')

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
  await expect(page.getByTestId('money-value')).toHaveText('2 co / 1 pa / 3 s')
})
