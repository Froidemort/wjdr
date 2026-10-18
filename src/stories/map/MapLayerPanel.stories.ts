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
    onToggleType: fn(),
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
