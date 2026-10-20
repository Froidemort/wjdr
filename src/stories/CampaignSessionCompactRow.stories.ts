import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CampaignSessionCompactRow from '../components/campaign/CampaignSessionCompactRow.vue'
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

const meta: Meta<typeof CampaignSessionCompactRow> = {
  title: 'Campaign/CampaignSessionCompactRow',
  component: CampaignSessionCompactRow,
  tags: ['autodocs'],
  args: {
    session: baseSession,
    title: 'La route de Middenheim',
    todayKey: '2026-09-12',
    to: '/campaigns/campaign-1/timeline/session-1',
  },
  decorators: [() => ({ template: '<div class="max-w-sm"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof CampaignSessionCompactRow>

export const Today: Story = {}

export const Past: Story = {
  args: { todayKey: '2026-09-20' },
}

export const Upcoming: Story = {
  args: { todayKey: '2026-09-09' },
}

export const LongTitle: Story = {
  args: {
    todayKey: '2026-09-09',
    title: 'Une très longue session dont le titre dépasse largement la largeur disponible sur mobile',
  },
}
