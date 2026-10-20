import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import CatalogAddModal from '../../components/character/CatalogAddModal.vue'
import type { CatalogItem } from '../../types/domain'
import { openedDialog } from './openedDialog'

const option = (id: string, name: string): CatalogItem => ({
  id,
  name,
  description: null,
  specialization: null,
  encumbrance: null,
  damageFormula: null,
  armorPoints: null,
})

const meta: Meta<typeof CatalogAddModal> = {
  title: 'Character/CatalogAddModal',
  component: openedDialog(CatalogAddModal) as typeof CatalogAddModal,
  tags: ['autodocs'],
  args: {
    section: 'skills',
    sectionLabel: 'compétences',
    options: [option('s1', 'Soins'), option('s2', 'Esquive')],
    hiddenOptionsCount: 0,
    selectedIds: [],
    selectedLabels: {},
    searchLoading: false,
    error: null,
    adding: false,
    creating: false,
    formatLabel: (item: CatalogItem) => item.name,
    query: '',
    mode: 'search',
    itemsQuality: 'normal',
    itemsQuantity: 1,
    form: { name: '', description: '', quality: 'normal', encumbrance: 0, quantity: 1 },
    onClose: fn(),
    onToggle: fn(),
    onRemove: fn(),
    'onConfirm-add': fn(),
    'onConfirm-create': fn(),
    'onUpdate:mode': fn(),
    'onUpdate:query': fn(),
  },
}

export default meta
type Story = StoryObj<typeof CatalogAddModal>

export const ToggleOption: Story = {
  play: async ({ args }) => {
    await expect(await screen.findByRole('heading', { name: 'Ajouter des compétences' })).toBeVisible()
    await expect(screen.getByRole('button', { name: /Ajouter \(0\)/ })).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Esquive' }))

    await expect(args.onToggle).toHaveBeenCalledWith('s2')
  },
}

export const WithSelection: Story = {
  args: { selectedIds: ['s1'], selectedLabels: { s1: 'Soins' } },
  play: async ({ args }) => {
    await expect(await screen.findByText('1 sélectionné(s)')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Retirer Soins de la sélection' }))
    await expect(args.onRemove).toHaveBeenCalledWith('s1')

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter (1)' }))
    await expect(args['onConfirm-add']).toHaveBeenCalled()
  },
}

export const Empty: Story = {
  args: { options: [] },
  play: async () => {
    await expect(await screen.findByText('Saisissez au moins 2 caractères.')).toBeVisible()
  },
}

export const Searching: Story = {
  args: { searchLoading: true },
  play: async () => {
    await expect(await screen.findByText('Recherche en cours...')).toBeVisible()
  },
}

export const WithError: Story = {
  args: { error: 'Ajout impossible.' },
  play: async () => {
    await expect(await screen.findByRole('alert')).toHaveTextContent('Ajout impossible.')
  },
}

export const Adding: Story = {
  args: { adding: true, selectedIds: ['s1'], selectedLabels: { s1: 'Soins' } },
  play: async () => {
    await screen.findByRole('dialog')
    await expect(screen.getByRole('button', { name: /Ajouter \(1\)/ })).toBeDisabled()
  },
}

export const ItemsSearchMode: Story = {
  args: { section: 'items', sectionLabel: 'équipements' },
  play: async ({ args }) => {
    await expect(await screen.findByLabelText('Quantité')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Création' }))

    await expect(args['onUpdate:mode']).toHaveBeenCalledWith('create')
  },
}

export const ItemsCreateMode: Story = {
  args: {
    section: 'items',
    sectionLabel: 'équipements',
    mode: 'create',
    form: { name: 'Torche', description: '', quality: 'normal', encumbrance: 1, quantity: 2 },
  },
  play: async ({ args }) => {
    await expect(await screen.findByLabelText('Nom')).toHaveValue('Torche')

    await userEvent.click(screen.getByRole('button', { name: 'Créer et ajouter' }))

    await expect(args['onConfirm-create']).toHaveBeenCalled()
  },
}

export const Creating: Story = {
  args: { section: 'items', sectionLabel: 'équipements', mode: 'create', creating: true },
  play: async () => {
    await screen.findByRole('dialog')
    await expect(screen.getByRole('button', { name: 'Créer et ajouter' })).toBeDisabled()
  },
}
