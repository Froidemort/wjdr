import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent } from 'storybook/test'
import MarkerDetailSheet from '../../components/map/MarkerDetailSheet.vue'
import { baseMarker, campaignMarker, markerTypes } from './fixtures'

const meta: Meta<typeof MarkerDetailSheet> = {
  title: 'Map/MarkerDetailSheet',
  component: MarkerDetailSheet,
  tags: ['autodocs'],
  args: {
    marker: campaignMarker,
    type: markerTypes[1],
    canEdit: true,
    onClose: fn(),
    onCenter: fn(),
    onEdit: fn(),
    onRemove: fn(),
  },
  decorators: [() => ({ template: '<div class="relative h-96"><story /></div>' })],
}

export default meta
type Story = StoryObj<typeof MarkerDetailSheet>

export const EditableCampaignMarker: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('heading', { name: 'Cache du contrebandier' })).toBeVisible()
    await expect(canvas.getByText('Tous les joueurs')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Modifier' }))
    await expect(args.onEdit).toHaveBeenCalled()
  },
}

export const ReadOnlyBaseMarker: Story = {
  args: { marker: baseMarker, type: markerTypes[0], canEdit: false },
  play: async ({ canvas, args }) => {
    await expect(canvas.queryByRole('button', { name: 'Modifier' })).toBeNull()
    await expect(canvas.queryByRole('button', { name: 'Supprimer' })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Centrer' }))
    await expect(args.onCenter).toHaveBeenCalled()
  },
}

export const PendingMarkerHidesActions: Story = {
  args: { marker: { ...campaignMarker, pending: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Enregistrement…')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Modifier' })).toBeNull()
  },
}

export const DeleteNeedsConfirmation: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Supprimer' }))
    await expect(args.onRemove).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Confirmer la suppression' }))
    await expect(args.onRemove).toHaveBeenCalledOnce()
  },
}

export const CloseButton: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Fermer' }))
    await expect(args.onClose).toHaveBeenCalled()
  },
}
