import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import CharacterSyncStatus from '../../components/character/CharacterSyncStatus.vue'

const meta: Meta<typeof CharacterSyncStatus> = {
  title: 'Character/CharacterSyncStatus',
  component: CharacterSyncStatus,
  tags: ['autodocs'],
  args: { state: 'ok', queuedCount: 0, online: true, onRetry: fn() },
}

export default meta
type Story = StoryObj<typeof CharacterSyncStatus>

export const Saved: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Enregistré')
  },
}

export const Saving: Story = {
  args: { state: 'loading' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Enregistrement...')
  },
}

export const ErrorWithRetry: Story = {
  args: { state: 'error' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Erreur de sauvegarde')

    await userEvent.click(canvas.getByRole('button', { name: 'Réessayer' }))

    await expect(args.onRetry).toHaveBeenCalled()
  },
}

export const ErrorOfflineDisablesRetry: Story = {
  args: { state: 'error', online: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Réessayer' })).toBeDisabled()
  },
}

export const PendingOffline: Story = {
  args: { queuedCount: 2, online: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('2 modifications en attente')
  },
}
