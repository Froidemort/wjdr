import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent } from 'storybook/test'
import { ref } from 'vue'
import SearchSelect from '../components/ui/SearchSelect.vue'

const options = [
  { id: 'c-1', label: 'Apprenti sorcier' },
  { id: 'c-2', label: 'Écuyer' },
  { id: 'c-3', label: 'Sorcier' },
]

const meta: Meta<typeof SearchSelect> = {
  title: 'UI/SearchSelect',
  component: SearchSelect,
  tags: ['autodocs'],
  args: { options, label: 'Départ', placeholder: 'Rechercher une carrière' },
  render: (args) => ({
    components: { SearchSelect },
    setup() {
      const model = ref('')
      return { args, model }
    },
    template: '<SearchSelect v-bind="args" v-model="model" />',
  }),
}

export default meta
type Story = StoryObj<typeof SearchSelect>

export const FiltersIgnoringCaseAndAccents: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Départ' }), 'ecuy')
    await expect(canvas.getByRole('button', { name: 'Écuyer' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Sorcier' })).toBeNull()
  },
}

export const NoResult: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Départ' }), 'zzz')
    await expect(canvas.getByText('Aucun résultat.')).toBeVisible()
  },
}

export const PickAndClear: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Départ' }), 'sorc')
    await userEvent.click(canvas.getByRole('button', { name: 'Sorcier' }))
    await expect(canvas.queryByRole('searchbox')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Retirer : Sorcier' }))
    await expect(canvas.getByRole('searchbox', { name: 'Départ' })).toBeVisible()
  },
}
