import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import MarkdownEditor from '../components/campaign/MarkdownEditor.vue'

const meta: Meta<typeof MarkdownEditor> = {
  title: 'Campaign/MarkdownEditor',
  component: MarkdownEditor,
  tags: ['autodocs'],
  args: { modelValue: '' },
  decorators: [() => ({ template: '<div class="max-w-md"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof MarkdownEditor>

export const Empty: Story = {}

export const WithDraft: Story = {
  args: { modelValue: '## Taverne du Sanglier\n\n- Rencontre avec **Ulric**\n- Indice: *clé en cuivre*' },
}

export const Preview: Story = {
  args: { modelValue: '**Gras**, *italique*\n\n> Citation\n\n- Puce' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: 'Aperçu' }))
    await expect(canvas.getByText('Citation')).toBeVisible()
  },
}
