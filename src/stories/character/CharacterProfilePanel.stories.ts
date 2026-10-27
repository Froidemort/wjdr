import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent } from 'storybook/test'
import CharacterProfilePanel from '../../components/character/CharacterProfilePanel.vue'
import type { CharacterStatValue } from '../../types/domain'

const stat = (statCode: string, baseValue: number, isSecondary = false): CharacterStatValue => ({
  statCode,
  baseValue,
  currentAdvanced: 0,
  totalAdvanced: 0,
  isSecondary,
})

const stats: CharacterStatValue[] = [
  stat('CC', 30),
  stat('CT', 30),
  stat('F', 30),
  stat('E', 30),
  stat('AG', 30),
  stat('INT', 30),
  stat('FM', 30),
  stat('SOC', 30),
  stat('A', 1, true),
  stat('M', 4, true),
]

const meta: Meta<typeof CharacterProfilePanel> = {
  title: 'Character/CharacterProfilePanel',
  component: CharacterProfilePanel,
  tags: ['autodocs'],
  args: {
    stats,
    editable: true,
    'onStat-tick': fn(),
    'onStat-base-change': fn(),
    'onStat-total-advanced-change': fn(),
  },
}

export default meta
type Story = StoryObj<typeof CharacterProfilePanel>

export const AllCompactByDefault: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Tout détailler')).toBeVisible()
    await expect(canvas.queryByText('Valeur totale')).toBeNull()
  },
}

export const ClickingACardExpandsItOnly: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^CC 30/ }))

    await expect(canvas.getAllByText('Valeur totale')).toHaveLength(1)
    await expect(canvas.getByRole('button', { name: /^CT 30/ })).toBeVisible()
  },
}

export const ClickingAnExpandedCardCollapsesItBack: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^CC 30/ }))
    await expect(canvas.getByText('Valeur totale')).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'CC' }))

    await expect(canvas.queryByText('Valeur totale')).toBeNull()
    await expect(canvas.getByRole('button', { name: /^CC 30/ })).toBeVisible()
  },
}

export const ToggleAllExpandsEveryCard: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Tout détailler'))

    await expect(canvas.getByText('Tout compacter')).toBeVisible()
    await expect(canvas.getAllByText('Valeur totale')).toHaveLength(stats.length)
  },
}

export const ToggleAllCompactsEveryCardAgain: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Tout détailler'))
    await userEvent.click(canvas.getByText('Tout compacter'))

    await expect(canvas.getByText('Tout détailler')).toBeVisible()
    await expect(canvas.queryByText('Valeur totale')).toBeNull()
  },
}

export const EmptyStats: Story = {
  args: { stats: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Aucune caractéristique disponible.')).toBeVisible()
    await expect(canvas.getByText('Tout détailler')).toBeDisabled()
  },
}
