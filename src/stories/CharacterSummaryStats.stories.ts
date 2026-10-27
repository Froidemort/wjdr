import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect } from 'storybook/test'
import CharacterSummaryStats from '../components/ui/CharacterSummaryStats.vue'
import type { CharacterSummary } from '../types/domain'

const character: CharacterSummary = {
  id: 'c1',
  name: 'Ulrik',
  race: 'humain',
  gender: 'masculin',
  campaignId: 'camp1',
  userId: 'u1',
  careerId: 'career1',
  careerName: 'Soldat',
  ownerAvatarUrl: null,
  pvCurrent: 9,
  pvMax: 12,
  fortuneCurrent: 2,
  fortuneMax: 3,
  destinyCurrent: 1,
  destinyMax: 2,
  xpTotal: 100,
  xpAvailable: 20,
  insanityPoints: 1,
  moneyGold: 0,
  moneySilver: 0,
  moneyCopper: 0,
}

const meta: Meta<typeof CharacterSummaryStats> = {
  title: 'Components/CharacterSummaryStats',
  component: CharacterSummaryStats,
  tags: ['autodocs'],
  args: { character },
}

export default meta
type Story = StoryObj<typeof CharacterSummaryStats>

export const Default: Story = {
  play: async ({ canvas }) => {
    for (const name of ['Vie', 'Fortune', 'Destin']) {
      await expect(canvas.getByRole('progressbar', { name })).toBeVisible()
    }
  },
}

export const Compact: Story = {
  args: { compact: true },
}
