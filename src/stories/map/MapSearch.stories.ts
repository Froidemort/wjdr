import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent } from 'storybook/test'
import MapSearch from '../../components/map/MapSearch.vue'
import { baseMarker, campaignMarker } from './fixtures'

const meta: Meta<typeof MapSearch> = {
  title: 'Map/MapSearch',
  component: MapSearch,
  tags: ['autodocs'],
  args: { results: [baseMarker, campaignMarker], onSelect: fn() },
}

export default meta
type Story = StoryObj<typeof MapSearch>

export const Closed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('list', { name: 'Résultats de recherche' })).toBeNull()
  },
}

export const ShowsResultsWhileTyping: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Rechercher un lieu sur la carte'), 'alt')
    await expect(canvas.getByRole('button', { name: 'Altdorf' })).toBeVisible()
  },
}

export const NoResult: Story = {
  args: { results: [] },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Rechercher un lieu sur la carte'), 'zzz')
    await expect(canvas.getByText('Aucun lieu trouvé.')).toBeVisible()
  },
}

export const PickingAResultEmitsAndClearsTheQuery: Story = {
  play: async ({ canvas, args }) => {
    const input = canvas.getByLabelText('Rechercher un lieu sur la carte')
    await userEvent.type(input, 'alt')
    await userEvent.click(canvas.getByRole('button', { name: 'Altdorf' }))

    await expect(args.onSelect).toHaveBeenCalledWith(baseMarker)
    await expect(input).toHaveValue('')
  },
}
