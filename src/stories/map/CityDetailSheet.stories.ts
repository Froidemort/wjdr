import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent } from 'storybook/test'
import CityDetailSheet from '../../components/map/CityDetailSheet.vue'
import type { City } from '../../types/cities'

const altdorf: City = {
  id: 1,
  name: 'Altdorf',
  lat: 48.1,
  lng: 11.5,
  type: 'Cité',
  population: 105000,
  region: 'Reikland',
  country: 'Empire',
  subregion: null,
  url: null,
  pending: false,
  hidden: false,
  source: null,
}

const meta: Meta<typeof CityDetailSheet> = {
  title: 'Map/CityDetailSheet',
  component: CityDetailSheet,
  tags: ['autodocs'],
  args: { city: altdorf, onClose: fn(), onCenter: fn() },
  decorators: [() => ({ template: '<div class="relative h-96"><story /></div>' })],
}

export default meta
type Story = StoryObj<typeof CityDetailSheet>

export const Full: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Altdorf' })).toBeVisible()
    await expect(canvas.getByText('Reikland')).toBeVisible()
    await expect(canvas.getByText('Cité')).toBeVisible()
    await expect(canvas.getByText(/105.000 habitants/)).toBeVisible()
  },
}

export const MinimalDetails: Story = {
  args: { city: { ...altdorf, name: 'Hameau', type: null, population: null, region: null } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Hameau' })).toBeVisible()
    await expect(canvas.queryByText(/habitants/)).toBeNull()
  },
}

export const CenterEmitsEvent: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Centrer' }))
    await expect(args.onCenter).toHaveBeenCalledOnce()
  },
}

export const CloseEmitsEvent: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Fermer' }))
    await expect(args.onClose).toHaveBeenCalledOnce()
  },
}
