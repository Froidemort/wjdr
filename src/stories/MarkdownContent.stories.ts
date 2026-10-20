import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MarkdownContent from '../components/campaign/MarkdownContent.vue'

const meta: Meta<typeof MarkdownContent> = {
  title: 'Campaign/MarkdownContent',
  component: MarkdownContent,
  tags: ['autodocs'],
  args: { source: '**Gras**, *italique*\n\n> Citation\n\n- Puce\n- [Lien](https://example.com)' },
  decorators: [() => ({ template: '<div class="max-w-md"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof MarkdownContent>

export const Default: Story = {}

export const Sanitized: Story = {
  args: { source: 'Texte <script>alert(1)</script> [piégé](javascript:alert(1))' },
}

export const Headings: Story = {
  args: { source: '### Titre\n\n#### Sous-titre\n\n1. Un\n2. Deux\n\n`code` inline' },
}

export const Empty: Story = {
  args: { source: '' },
}
