import type { Page } from '@playwright/test'
import { E2E_CHARACTER_ID, expect } from './supabaseAuth'

export async function openCharacterSheet(page: Page): Promise<void> {
  await page.goto(`/characters/${E2E_CHARACTER_ID}`)
  await expect(page.getByRole('heading', { name: 'Aperçu' })).toBeVisible()
  await expect(page.locator('html.app-splash-active')).toHaveCount(0)
}
