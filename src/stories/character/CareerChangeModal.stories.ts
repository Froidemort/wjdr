import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import CareerChangeModal from '../../components/character/CareerChangeModal.vue'
import type { CatalogItem } from '../../types/domain'
import { openedDialog } from './openedDialog'

const career = (id: string, name: string): CatalogItem => ({
  id,
  name,
  description: null,
  specialization: null,
  encumbrance: null,
  damageFormula: null,
  armorPoints: null,
})

const meta: Meta<typeof CareerChangeModal> = {
  title: 'Character/CareerChangeModal',
  component: openedDialog(CareerChangeModal) as typeof CareerChangeModal,
  tags: ['autodocs'],
  args: {
    options: [career('c1', 'Soldat'), career('c2', 'Garde')],
    pathOptionsCount: 2,
    pathLoading: false,
    searchLoading: false,
    selectedId: null,
    selectedName: null,
    error: null,
    successMessage: null,
    busy: false,
    filterMode: 'paths',
    query: '',
    onClose: fn(),
    onSelect: fn(),
    onConfirm: fn(),
    'onUpdate:filterMode': fn(),
    'onUpdate:query': fn(),
  },
}

export default meta
type Story = StoryObj<typeof CareerChangeModal>

export const SelectAndConfirm: Story = {
  play: async ({ args }) => {
    await expect(await screen.findByRole('heading', { name: 'Changer de carrière' })).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Garde' }))
    await expect(args.onSelect).toHaveBeenCalledWith('c2', 'Garde')

    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    await expect(args.onConfirm).toHaveBeenCalled()
  },
}

export const SwitchToAllFilter: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'Toutes' }))

    await expect(args['onUpdate:filterMode']).toHaveBeenCalledWith('all')
  },
}

export const Selected: Story = {
  args: { selectedId: 'c1', selectedName: 'Soldat' },
  play: async () => {
    await expect(await screen.findByText('Sélection: Soldat')).toBeVisible()
  },
}

export const EmptyPaths: Story = {
  args: { options: [], pathOptionsCount: 0 },
  play: async () => {
    await expect(await screen.findByText('Aucun débouché disponible pour la carrière actuelle.')).toBeVisible()
  },
}

export const EmptyAllSearch: Story = {
  args: { options: [], filterMode: 'all' },
  play: async () => {
    await expect(await screen.findByText('Commencez à taper pour rechercher une carrière.')).toBeVisible()
  },
}

export const Loading: Story = {
  args: { pathLoading: true, searchLoading: true },
  play: async () => {
    await expect(await screen.findByText('Chargement des débouchés...')).toBeVisible()
    await expect(screen.getByText('Recherche des carrières...')).toBeVisible()
  },
}

export const WithError: Story = {
  args: { error: 'Carrière introuvable.' },
  play: async () => {
    await expect(await screen.findByRole('alert')).toHaveTextContent('Carrière introuvable.')
  },
}

export const WithSuccess: Story = {
  args: { successMessage: 'Carrière mise à jour.' },
  play: async () => {
    await expect(await screen.findByRole('status')).toHaveTextContent('Carrière mise à jour.')
  },
}

export const Busy: Story = {
  args: { busy: true },
  play: async () => {
    await screen.findByRole('dialog')
    await expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  },
}
