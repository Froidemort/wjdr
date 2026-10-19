import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent } from 'storybook/test'
import MapLayerPanel from '../../components/map/MapLayerPanel.vue'
import { markerTypes } from './fixtures'

const meta: Meta<typeof MapLayerPanel> = {
  title: 'Map/MapLayerPanel',
  component: MapLayerPanel,
  tags: ['autodocs'],
  args: {
    types: markerTypes,
    hiddenTypeIds: [],
    hasCampaign: true,
    showBase: true,
    showCampaign: true,
    showCities: true,
    onToggleType: fn(),
    onPrefetch: fn(),
    onCancelPrefetch: fn(),
  },
}

export default meta
type Story = StoryObj<typeof MapLayerPanel>

export const WithCampaign: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Marqueurs de campagne')).toBeEnabled()
    await expect(canvas.getByLabelText('Ville')).toBeChecked()
  },
}

export const SignedOutWithoutCampaign: Story = {
  args: { hasCampaign: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Marqueurs de campagne')).toBeDisabled()
    await expect(canvas.getByText(/choisis une campagne/)).toBeVisible()
  },
}

export const HiddenTypeIsUnchecked: Story = {
  args: { hiddenTypeIds: ['t-city'] },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Ville')).not.toBeChecked()
    await expect(canvas.getByLabelText('Note')).toBeChecked()
  },
}

export const TogglingATypeEmitsItsId: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByLabelText('Note'))
    await expect(args.onToggleType).toHaveBeenCalledWith('t-note')
  },
}

export const CitiesToggle: Story = {
  play: async ({ canvas }) => {
    const toggle = canvas.getByLabelText('Villes et lieux-dits')
    await expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    await expect(toggle).not.toBeChecked()
  },
}

export const PrefetchIdle: Story = {
  args: { prefetch: { running: false, done: 0, total: 0, failed: 0, message: null } },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Précharger la carte/ }))
    await expect(args.onPrefetch).toHaveBeenCalledOnce()
  },
}

export const PrefetchRunning: Story = {
  args: { prefetch: { running: true, done: 340, total: 1360, failed: 0, message: null } },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('340 / 1360 tuiles')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /Précharger/ })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Annuler' }))
    await expect(args.onCancelPrefetch).toHaveBeenCalledOnce()
  },
}

export const PrefetchDone: Story = {
  args: { prefetch: { running: false, done: 1360, total: 1360, failed: 0, message: 'Carte préchargée.' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Carte préchargée.')).toBeVisible()
  },
}

export const PrefetchAuthRequired: Story = {
  args: { prefetch: { running: false, done: 12, total: 1360, failed: 0, message: 'Connecte-toi pour précharger la carte.' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Connecte-toi pour précharger la carte.')).toBeVisible()
  },
}
