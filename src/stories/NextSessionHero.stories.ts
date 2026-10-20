import type { Meta, StoryObj } from '@storybook/vue3-vite'
import NextSessionHero from '../components/campaign/NextSessionHero.vue'
import type { SessionSummary } from '../types/domain'

const baseSession: SessionSummary = {
  id: 'session-1',
  campaignId: 'campaign-1',
  date: '2026-09-12',
  name: 'La route de Middenheim',
  description: null,
  createdAt: null,
  updatedAt: null,
}

const meta: Meta<typeof NextSessionHero> = {
  title: 'Campaign/NextSessionHero',
  component: NextSessionHero,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof NextSessionHero>

export const Today: Story = {
  args: { session: baseSession, todayKey: '2026-09-12' },
}

export const Upcoming: Story = {
  args: { session: baseSession, todayKey: '2026-09-09' },
}

export const None: Story = {
  args: { session: null, todayKey: '2026-09-09' },
}
