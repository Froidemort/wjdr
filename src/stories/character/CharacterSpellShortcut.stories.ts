import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect } from 'storybook/test'
import CharacterSpellShortcut from '../../components/character/CharacterSpellShortcut.vue'

const meta: Meta<typeof CharacterSpellShortcut> = {
  title: 'Character/CharacterSpellShortcut',
  component: CharacterSpellShortcut,
  args: { userId: 'storybook-user', characterId: 'storybook-character' },
}

export default meta
type Story = StoryObj<typeof CharacterSpellShortcut>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Mes sorts' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Configurer les catégories' })).toBeVisible()
  },
}
