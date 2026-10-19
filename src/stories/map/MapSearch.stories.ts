import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent } from 'storybook/test'
import MapSearch from '../../components/map/MapSearch.vue'
import type { MapSearchResult } from '../../types/map'

const altdorf: MapSearchResult = { kind: 'marker', key: 'marker-1', name: 'Altdorf', id: '1' }
const taverne: MapSearchResult = { kind: 'city', key: 'city-2', name: 'Taverne', id: 2 }

const meta: Meta<typeof MapSearch> = {
  title: 'Map/MapSearch',
  component: MapSearch,
  tags: ['autodocs'],
  args: { results: [altdorf, taverne], onSelect: fn() },
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

    await expect(args.onSelect).toHaveBeenCalledWith(altdorf)
    await expect(input).toHaveValue('')
  },
}
