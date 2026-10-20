import { computed, effectScope, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CatalogItem } from '../../src/types/domain'

const repo = vi.hoisted(() => ({
  createCatalogItem: vi.fn(),
  searchCatalog: vi.fn(),
  addCharacterArmors: vi.fn(),
  addCharacterItems: vi.fn(),
  addCharacterSkills: vi.fn(),
  addCharacterTalents: vi.fn(),
  addCharacterWeapons: vi.fn(),
}))

vi.mock('../../src/services/catalogRepository', () => ({
  createCatalogItem: repo.createCatalogItem,
  searchCatalog: repo.searchCatalog,
}))
vi.mock('../../src/services/characterLinksRepository', () => ({
  addCharacterArmors: repo.addCharacterArmors,
  addCharacterItems: repo.addCharacterItems,
  addCharacterSkills: repo.addCharacterSkills,
  addCharacterTalents: repo.addCharacterTalents,
  addCharacterWeapons: repo.addCharacterWeapons,
}))

import {
  formatCatalogOptionLabel,
  useCharacterCatalogActions,
} from '../../src/composables/useCharacterCatalogActions'

function option(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'o1',
    name: 'Objet',
    description: null,
    specialization: null,
    encumbrance: null,
    damageFormula: null,
    armorPoints: null,
    ...overrides,
  }
}

function setup(overrides: { canEdit?: boolean; confirm?: boolean } = {}) {
  const deps = {
    character: ref<{ id: string } | null>({ id: 'char-1' }),
    canEditQuickSection: computed(() => overrides.canEdit ?? true),
    invalidateCurrentLinksCache: vi.fn(),
    loadCharacterLinks: vi.fn().mockResolvedValue(undefined),
    setSectionSuccess: vi.fn(),
    confirmDestructiveAction: vi.fn().mockResolvedValue(overrides.confirm ?? true),
    catalogDialogRef: ref<HTMLDialogElement | null>(null),
  }
  const api = effectScope().run(() => useCharacterCatalogActions(deps))!
  return { api, deps }
}

describe('formatCatalogOptionLabel', () => {
  it('appends specialization for skills and talents', () => {
    const o = option({ name: 'Metier', specialization: ' Forgeron ' })
    expect(formatCatalogOptionLabel('skills', o)).toBe('Metier (Forgeron)')
    expect(formatCatalogOptionLabel('talents', o)).toBe('Metier (Forgeron)')
  })

  it('omits specialization when absent', () => {
    expect(formatCatalogOptionLabel('skills', option({ name: 'Soins' }))).toBe('Soins')
  })

  it('shows encumbrance and damage for weapons', () => {
    const o = option({ name: 'Epee', encumbrance: 2, damageFormula: 'BF+4' })
    expect(formatCatalogOptionLabel('weapons', o)).toBe('Epee (enc. 2) - BF+4')
  })

  it('shows encumbrance and armor points for armors', () => {
    const o = option({ name: 'Cotte', encumbrance: 3, armorPoints: 1 })
    expect(formatCatalogOptionLabel('armors', o)).toBe('Cotte (enc. 3) - PA 1')
  })

  it('keeps zero encumbrance and zero armor points', () => {
    const o = option({ name: 'Cape', encumbrance: 0, armorPoints: 0 })
    expect(formatCatalogOptionLabel('armors', o)).toBe('Cape (enc. 0) - PA 0')
  })

  it('shows only name when weapon/armor metadata is missing', () => {
    expect(formatCatalogOptionLabel('weapons', option({ name: 'Epee' }))).toBe('Epee')
    expect(formatCatalogOptionLabel('armors', option({ name: 'Cotte' }))).toBe('Cotte')
  })

  it('shows encumbrance only for items', () => {
    const o = option({ name: 'Corde', encumbrance: 1, damageFormula: 'x', armorPoints: 2 })
    expect(formatCatalogOptionLabel('items', o)).toBe('Corde (enc. 1)')
  })
})

describe('useCharacterCatalogActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('confirmCatalogAdd', () => {
    it('reports an error when nothing is selected', async () => {
      const { api, deps } = setup()

      await api.confirmCatalogAdd()

      expect(api.catalogError.value).toBe('Veuillez sélectionner au moins un élément.')
      expect(deps.confirmDestructiveAction).not.toHaveBeenCalled()
    })

    it('does nothing when the user cancels the confirmation', async () => {
      const { api, deps } = setup({ confirm: false })
      api.openCatalogModal('skills')
      api.selectedCatalogIds.value = ['s1']

      await api.confirmCatalogAdd()

      expect(deps.confirmDestructiveAction).toHaveBeenCalledWith('Ajouter 1 élément(s) à la fiche ?')
      expect(repo.addCharacterSkills).not.toHaveBeenCalled()
      expect(api.addingCatalog.value).toBe(false)
      expect(deps.setSectionSuccess).not.toHaveBeenCalled()
    })

    it('does nothing when editing is not allowed', async () => {
      const { api, deps } = setup({ canEdit: false })
      api.selectedCatalogIds.value = ['s1']

      await api.confirmCatalogAdd()

      expect(deps.confirmDestructiveAction).not.toHaveBeenCalled()
    })

    it.each([
      ['skills', 'addCharacterSkills'],
      ['talents', 'addCharacterTalents'],
      ['weapons', 'addCharacterWeapons'],
      ['armors', 'addCharacterArmors'],
    ] as const)('dispatches %s to its repository then refreshes links', async (section, fn) => {
      const { api, deps } = setup()
      api.openCatalogModal(section)
      api.selectedCatalogIds.value = ['a', 'b']

      await api.confirmCatalogAdd()

      expect(repo[fn]).toHaveBeenCalledWith('char-1', ['a', 'b'])
      expect(deps.invalidateCurrentLinksCache).toHaveBeenCalledOnce()
      expect(deps.loadCharacterLinks).toHaveBeenCalledWith('char-1', { force: true })
      expect(deps.setSectionSuccess).toHaveBeenCalledWith('catalog', '2 élément(s) ajouté(s).')
    })

    it.each([
      [3.9, 3],
      [0, 1],
      [-5, 1],
      [Number.NaN, 1],
    ])('normalizes item quantity %s to %s', async (input, expected) => {
      const { api } = setup()
      api.openCatalogModal('items')
      api.selectedCatalogIds.value = ['i1']
      api.selectedItemsQuantity.value = input
      api.selectedItemsQuality.value = 'normal'

      await api.confirmCatalogAdd()

      expect(repo.addCharacterItems).toHaveBeenCalledWith('char-1', ['i1'], expected, 'normal')
    })

    it('exposes the repository error and keeps the modal state', async () => {
      const { api, deps } = setup()
      api.openCatalogModal('skills')
      api.selectedCatalogIds.value = ['s1']
      repo.addCharacterSkills.mockRejectedValueOnce(new Error('boom'))

      await api.confirmCatalogAdd()

      expect(api.catalogError.value).toBe('boom')
      expect(api.selectedCatalogIds.value).toEqual(['s1'])
      expect(deps.setSectionSuccess).not.toHaveBeenCalled()
      expect(api.addingCatalog.value).toBe(false)
    })

    it('uses a generic message for non-Error rejections', async () => {
      const { api } = setup()
      api.openCatalogModal('skills')
      api.selectedCatalogIds.value = ['s1']
      repo.addCharacterSkills.mockRejectedValueOnce('nope')

      await api.confirmCatalogAdd()

      expect(api.catalogError.value).toBe('Ajout impossible.')
    })

    it('uses the safe add fallback for coded backend errors', async () => {
      const { api, deps } = setup()
      api.openCatalogModal('skills')
      api.selectedCatalogIds.value = ['s1']
      repo.addCharacterSkills.mockRejectedValueOnce({
        code: '42501',
        message: 'permission denied for table character_skills',
      })

      await api.confirmCatalogAdd()

      expect(api.catalogError.value).toBe('Ajout impossible.')
      expect(api.catalogError.value).not.toContain('character_skills')
      expect(api.selectedCatalogIds.value).toEqual(['s1'])
      expect(deps.setSectionSuccess).not.toHaveBeenCalled()
    })
  })

  describe('confirmItemCreate', () => {
    beforeEach(() => {
      repo.createCatalogItem.mockResolvedValue({ id: 'new-1' })
    })

    it('requires a non-blank name', async () => {
      const { api, deps } = setup()
      api.newItemForm.value.name = '   '

      await api.confirmItemCreate()

      expect(api.catalogError.value).toBe("Le nom de l'équipement est obligatoire.")
      expect(deps.confirmDestructiveAction).not.toHaveBeenCalled()
    })

    it('does not create anything when the user cancels', async () => {
      const { api } = setup({ confirm: false })
      api.newItemForm.value.name = 'Torche'

      await api.confirmItemCreate()

      expect(repo.createCatalogItem).not.toHaveBeenCalled()
      expect(repo.addCharacterItems).not.toHaveBeenCalled()
      expect(api.creatingItem.value).toBe(false)
    })

    it('trims the name and normalizes encumbrance and quantity', async () => {
      const { api, deps } = setup()
      api.newItemForm.value = {
        name: '  Torche ',
        description: '',
        quality: 'normal',
        encumbrance: -2.7,
        quantity: 2.8,
      }

      await api.confirmItemCreate()

      expect(repo.createCatalogItem).toHaveBeenCalledWith({
        name: 'Torche',
        description: null,
        encumbrance: 0,
      })
      expect(repo.addCharacterItems).toHaveBeenCalledWith('char-1', ['new-1'], 2, 'normal')
      expect(deps.loadCharacterLinks).toHaveBeenCalledWith('char-1', { force: true })
      expect(deps.setSectionSuccess).toHaveBeenCalledWith('catalog', 'Équipement créé et ajouté.')
    })

    it('floors positive encumbrance and clamps quantity to 1', async () => {
      const { api } = setup()
      api.newItemForm.value = {
        name: 'Sac',
        description: 'Cuir',
        quality: 'normal',
        encumbrance: 4.9,
        quantity: 0,
      }

      await api.confirmItemCreate()

      expect(repo.createCatalogItem).toHaveBeenCalledWith({
        name: 'Sac',
        description: 'Cuir',
        encumbrance: 4,
      })
      expect(repo.addCharacterItems).toHaveBeenCalledWith('char-1', ['new-1'], 1, 'normal')
    })

    it('exposes the error when creation fails', async () => {
      const { api } = setup()
      api.newItemForm.value.name = 'Torche'
      repo.createCatalogItem.mockRejectedValueOnce(new Error('denied'))

      await api.confirmItemCreate()

      expect(api.catalogError.value).toBe('denied')
      expect(repo.addCharacterItems).not.toHaveBeenCalled()
      expect(api.creatingItem.value).toBe(false)
    })

    it('uses the safe create fallback for coded backend errors', async () => {
      const { api } = setup()
      api.newItemForm.value.name = 'Torche'
      repo.createCatalogItem.mockRejectedValueOnce({
        code: '42501',
        message: 'new row violates row-level security policy for table catalog_items',
      })

      await api.confirmItemCreate()

      expect(api.catalogError.value).toBe('Création impossible.')
      expect(api.catalogError.value).not.toContain('catalog_items')
      expect(repo.addCharacterItems).not.toHaveBeenCalled()
      expect(api.creatingItem.value).toBe(false)
    })

    it('reuses the created item on retry after the link step failed', async () => {
      const { api } = setup()
      api.newItemForm.value.name = 'Torche'
      repo.addCharacterItems.mockRejectedValueOnce(new Error('link down'))

      await api.confirmItemCreate()
      await api.confirmItemCreate()

      expect(repo.createCatalogItem).toHaveBeenCalledOnce()
      expect(repo.addCharacterItems).toHaveBeenCalledTimes(2)
      expect(repo.addCharacterItems).toHaveBeenLastCalledWith('char-1', ['new-1'], 1, 'normal')
    })

    it('creates a new item when the form changed after a failed link', async () => {
      const { api } = setup()
      api.newItemForm.value.name = 'Torche'
      repo.addCharacterItems.mockRejectedValueOnce(new Error('link down'))

      await api.confirmItemCreate()
      api.newItemForm.value.name = 'Lanterne'
      await nextTick()
      await api.confirmItemCreate()

      expect(repo.createCatalogItem).toHaveBeenCalledTimes(2)
    })
  })

  describe('catalog search failure', () => {
    it('flags the failure instead of an empty result', async () => {
      vi.useFakeTimers()
      try {
        const { api } = setup()
        api.openCatalogModal('skills')
        repo.searchCatalog.mockRejectedValueOnce({
          code: '42P01',
          message: 'relation public.skills does not exist',
        })

        api.catalogQuery.value = 'sa'
        await nextTick()
        await vi.advanceTimersByTimeAsync(250)

        expect(api.catalogSearchFailed.value).toBe(true)
        expect(api.catalogOptions.value).toEqual([])
        expect(api.catalogError.value).toBe('Recherche impossible. Réessayez.')
        expect(api.catalogError.value).not.toContain('public.skills')
        expect(api.catalogSearchLoading.value).toBe(false)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('refresh failure after a successful write', () => {
    const REFRESH_MESSAGE = 'Ajout effectué, mais actualisation impossible. Rechargez la fiche.'

    it('reports the refresh failure and clears the selection after add', async () => {
      const { api, deps } = setup()
      api.openCatalogModal('skills')
      api.catalogOptions.value = [option({ id: 's1', name: 'Soins' })]
      api.toggleCatalogSelection('s1')
      deps.loadCharacterLinks.mockRejectedValueOnce({
        code: '42P01',
        message: 'relation public.character_skills does not exist',
      })

      await api.confirmCatalogAdd()

      expect(repo.addCharacterSkills).toHaveBeenCalledOnce()
      expect(api.catalogError.value).toBe(REFRESH_MESSAGE)
      expect(api.selectedCatalogIds.value).toEqual([])
      expect(api.selectedCatalogLabels.value).toEqual({})
      expect(deps.setSectionSuccess).not.toHaveBeenCalled()
    })

    it('reports the refresh failure and resets the form after item creation', async () => {
      const { api, deps } = setup()
      repo.createCatalogItem.mockResolvedValue({ id: 'new-1' })
      api.newItemForm.value.name = 'Torche'
      deps.loadCharacterLinks.mockRejectedValueOnce(new Error('offline'))

      await api.confirmItemCreate()

      expect(repo.addCharacterItems).toHaveBeenCalledOnce()
      expect(api.catalogError.value).toBe(REFRESH_MESSAGE)
      expect(api.newItemForm.value.name).toBe('')
      expect(deps.setSectionSuccess).not.toHaveBeenCalled()
    })

    it('does not re-add the cleared selection on a second confirmation', async () => {
      const { api, deps } = setup()
      api.openCatalogModal('skills')
      api.selectedCatalogIds.value = ['s1']
      deps.loadCharacterLinks.mockRejectedValueOnce(new Error('offline'))

      await api.confirmCatalogAdd()
      await api.confirmCatalogAdd()

      expect(repo.addCharacterSkills).toHaveBeenCalledOnce()
    })
  })

  describe('selection', () => {
    it('stores a label and clears the query on toggle, and removes on second toggle', () => {
      const { api } = setup()
      api.openCatalogModal('weapons')
      api.catalogOptions.value = [option({ id: 'w1', name: 'Epee', encumbrance: 2 })]

      api.toggleCatalogSelection('w1')
      expect(api.selectedCatalogIds.value).toEqual(['w1'])
      expect(api.selectedCatalogLabels.value).toEqual({ w1: 'Epee (enc. 2)' })
      expect(api.catalogOptions.value).toEqual([])

      api.toggleCatalogSelection('w1')
      expect(api.selectedCatalogIds.value).toEqual([])
      expect(api.selectedCatalogLabels.value).toEqual({})
    })
  })
})
