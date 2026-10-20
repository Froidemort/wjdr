import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SessionCreatePanel from '../components/campaign/SessionCreatePanel.vue'

const meta: Meta<typeof SessionCreatePanel> = {
  title: 'Campaign/SessionCreatePanel',
  component: SessionCreatePanel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    form: { date: '2026-09-12', name: '' },
    loading: false,
    error: null,
    dateError: null,
  },
}

export default meta

type Story = StoryObj<typeof SessionCreatePanel>

export const Open: Story = {}

export const Empty: Story = {
  args: { form: { date: '', name: '' } },
}

export const Pending: Story = {
  args: { form: { date: '2026-09-12', name: 'Le guet' }, loading: true },
}

export const DateConflict: Story = {
  args: { dateError: 'Une session existe déjà à cette date.' },
}

export const ServerError: Story = {
  args: { error: 'Acces refuse: seul le MJ de la campagne peut creer une session.' },
}
