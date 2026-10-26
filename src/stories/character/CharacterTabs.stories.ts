import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import { expect, userEvent } from 'storybook/test'
import CharacterTabs from '../../components/character/CharacterTabs.vue'
import type { CharacterTabId } from '../../types/characterSheet'

const meta: Meta<typeof CharacterTabs> = {
  title: 'Character/CharacterTabs',
  component: CharacterTabs,
  tags: ['autodocs'],
  render: (args) => ({
    components: { CharacterTabs },
    setup() {
      const active = ref<CharacterTabId>(args.modelValue)
      return { active }
    },
    template: '<CharacterTabs v-model="active" />',
  }),
  args: { modelValue: 'overview' },
}

export default meta
type Story = StoryObj<typeof CharacterTabs>

export const AllTabsWithOverviewFirst: Story = {
  play: async ({ canvas }) => {
    const tabs = canvas.getAllByRole('tab')
    await expect(tabs).toHaveLength(4)
    await expect(tabs[0]).toHaveAccessibleName(/Aperçu/)
    await expect(tabs[0]).toHaveAttribute('id', 'character-tab-overview')
    await expect(tabs[0]).toHaveAttribute('aria-controls', 'character-panel-overview')
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.queryByRole('button', { name: 'Retour en haut de la fiche' })).toBeNull()
  },
}

export const OverviewStaysVisibleWhenAnotherTabIsActive: Story = {
  args: { modelValue: 'inventory' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tab', { name: /Aperçu/ })).toBeVisible()
    await expect(canvas.getByRole('tab', { name: /Inventaire/ })).toHaveAttribute('aria-selected', 'true')
  },
}

export const KeyboardNavigationCoversFourTabs: Story = {
  play: async ({ canvas }) => {
    const overview = canvas.getByRole('tab', { name: /Aperçu/ })
    const stats = canvas.getByRole('tab', { name: /Stat/ })
    const inventory = canvas.getByRole('tab', { name: /Inventaire/ })

    overview.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(stats).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{End}')
    await expect(inventory).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{ArrowRight}')
    await expect(overview).toHaveAttribute('aria-selected', 'true')
    await expect(overview).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}')
    await expect(inventory).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{Home}')
    await expect(overview).toHaveAttribute('aria-selected', 'true')
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('tab')).toHaveLength(4)
    await expect(canvas.getByRole('tab', { name: /Aperçu/ })).toHaveAttribute('aria-selected', 'true')
  },
}
