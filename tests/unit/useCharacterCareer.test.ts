import { computed, effectScope, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const repo = vi.hoisted(() => ({
  searchCatalog: vi.fn(),
  listCareerCharacteristicsByCareerId: vi.fn(),
  listCareerPathCareersByFromCareerId: vi.fn(),
  replaceCharacterTotalAdvancedValues: vi.fn(),
  updateCharacterCareer: vi.fn(),
}))

vi.mock('../../src/services/catalogRepository', () => ({ searchCatalog: repo.searchCatalog }))
vi.mock('../../src/services/careersRepository', () => ({
  listCareerCharacteristicsByCareerId: repo.listCareerCharacteristicsByCareerId,
  listCareerPathCareersByFromCareerId: repo.listCareerPathCareersByFromCareerId,
}))
vi.mock('../../src/services/charactersRepository', () => ({
  replaceCharacterTotalAdvancedValues: repo.replaceCharacterTotalAdvancedValues,
  updateCharacterCareer: repo.updateCharacterCareer,
}))

import { useCharacterCareer } from '../../src/composables/useCharacterCareer'

function setup(options: { canEdit?: boolean; careerId?: string | null } = {}) {
  const deps = {
    character: ref({
      id: 'char-1',
      careerId: options.careerId === undefined ? 'c0' : options.careerId,
      stats: [],
    }),
    canEditQuickSection: computed(() => options.canEdit ?? true),
    loadCharacter: vi.fn().mockResolvedValue(undefined),
    setSectionSuccess: vi.fn(),
    careerDialogRef: ref<HTMLDialogElement | null>(null),
    careerConfirmDialogRef: ref<HTMLDialogElement | null>(null),
  }
  const api = effectScope().run(() =>
    useCharacterCareer(deps as unknown as Parameters<typeof useCharacterCareer>[0])
  )!
  return { api, deps }
}

async function prepareConfirm(api: ReturnType<typeof useCharacterCareer>) {
  repo.listCareerCharacteristicsByCareerId.mockResolvedValue([{ statCode: 'cc', value: 5 }])
  api.selectCareer('c1', 'Soldat')
  await api.confirmCareerChange()
}

describe('useCharacterCareer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repo.listCareerPathCareersByFromCareerId.mockResolvedValue([
      { id: 'p1', name: 'Garde' },
      { id: 'p2', name: 'Eclaireur' },
    ])
  })

  describe('career filtering', () => {
    it('lists all path careers by default and filters them by query', async () => {
      const { api } = setup()
      await api.openCareerModal()

      expect(api.careerOptions.value.map((c) => c.id)).toEqual(['p1', 'p2'])

      api.careerQuery.value = 'ecl'
      await nextTick()
      await vi.waitFor(() => expect(api.careerOptions.value.map((c) => c.id)).toEqual(['p2']))
      expect(repo.searchCatalog).not.toHaveBeenCalled()
    })

    it('yields no path options when the character has no career', async () => {
      const { api } = setup({ careerId: null })
      await api.openCareerModal()

      expect(repo.listCareerPathCareersByFromCareerId).not.toHaveBeenCalled()
      expect(api.careerOptions.value).toEqual([])
    })

    it('reports path loading errors', async () => {
      repo.listCareerPathCareersByFromCareerId.mockRejectedValueOnce(new Error('down'))
      const { api } = setup()

      await api.openCareerModal()

      expect(api.careerError.value).toBe('down')
      expect(api.careerPathLoading.value).toBe(false)
    })

    it('uses a safe fallback when loading path options rejects a coded backend error', async () => {
      repo.listCareerPathCareersByFromCareerId.mockRejectedValueOnce({
        code: '42P01',
        message: 'relation public.career_paths does not exist',
      })
      const { api } = setup()

      await api.openCareerModal()

      expect(api.careerError.value).toBe('Chargement des débouchés impossible.')
      expect(api.careerError.value).not.toContain('career_paths')
      expect(api.careerPathLoading.value).toBe(false)
    })

    it('in all mode requires 2+ characters before searching the catalog', async () => {
      const { api } = setup()
      await api.openCareerModal()
      repo.searchCatalog.mockResolvedValue([{ id: 'x', name: 'Xyz' }])

      api.selectCareer('p1', 'Garde')
      api.careerFilterMode.value = 'all'
      await vi.waitFor(() => expect(api.selectedCareerId.value).toBeNull())
      expect(api.careerOptions.value).toEqual([])
      expect(repo.searchCatalog).not.toHaveBeenCalled()

      api.careerQuery.value = 'xy'
      await vi.waitFor(() => expect(api.careerOptions.value).toHaveLength(1))
      expect(repo.searchCatalog).toHaveBeenCalledWith('careers', 'xy')
    })

    it('in all mode clears options when the catalog search fails', async () => {
      const { api } = setup()
      await api.openCareerModal()
      repo.searchCatalog.mockRejectedValue({
        code: '42P01',
        message: 'relation public.careers does not exist',
      })

      api.careerFilterMode.value = 'all'
      api.careerQuery.value = 'abc'
      await vi.waitFor(() => expect(repo.searchCatalog).toHaveBeenCalled())

      await vi.waitFor(() => expect(api.careerSearchLoading.value).toBe(false))
      expect(api.careerOptions.value).toEqual([])
      expect(api.careerError.value).toBe('Recherche des carrières impossible.')
      expect(api.careerError.value).not.toContain('public.careers')
    })
  })

  describe('confirmCareerChange', () => {
    it('requires a selection', async () => {
      const { api } = setup()

      await api.confirmCareerChange()

      expect(api.careerError.value).toBe('Veuillez sélectionner une carrière.')
    })

    it('ignores re-selecting the current career', async () => {
      const { api } = setup()
      api.selectCareer('c0', 'Actuelle')

      await api.confirmCareerChange()

      expect(repo.listCareerCharacteristicsByCareerId).not.toHaveBeenCalled()
      expect(api.careerError.value).toBeNull()
    })

    it('does nothing when editing is not allowed', async () => {
      const { api } = setup({ canEdit: false })
      api.selectCareer('c1', 'Soldat')

      await api.confirmCareerChange()

      expect(repo.listCareerCharacteristicsByCareerId).not.toHaveBeenCalled()
    })

    it('stores pending career and characteristics rows', async () => {
      const { api } = setup()

      await prepareConfirm(api)

      expect(api.pendingCareerName.value).toBe('Soldat')
      expect(api.pendingCareerCharacteristicRows.value).toEqual([{ statCode: 'CC', value: 5 }])
      expect(api.careerCharacteristicsLoading.value).toBe(false)
    })

    it('exposes characteristics loading errors', async () => {
      const { api } = setup()
      repo.listCareerCharacteristicsByCareerId.mockRejectedValue(new Error('nope'))
      api.selectCareer('c1', 'Soldat')

      await api.confirmCareerChange()

      expect(api.careerError.value).toBe('nope')
    })

    it('uses a safe fallback for coded characteristics loading errors', async () => {
      const { api } = setup()
      repo.listCareerCharacteristicsByCareerId.mockRejectedValueOnce({
        code: '42501',
        message: 'permission denied for table career_characteristics',
      })
      api.selectCareer('c1', 'Soldat')

      await api.confirmCareerChange()

      expect(api.careerError.value).toBe('Modification de carrière impossible.')
      expect(api.careerError.value).not.toContain('career_characteristics')
      expect(api.careerCharacteristicsLoading.value).toBe(false)
    })
  })

  describe('applyCareerChange', () => {
    it('does nothing without a pending career', async () => {
      const { api } = setup()

      await api.applyCareerChange(true)

      expect(repo.updateCharacterCareer).not.toHaveBeenCalled()
    })

    it('updates career only when characteristics are not applied', async () => {
      const { api, deps } = setup()
      await prepareConfirm(api)

      await api.applyCareerChange(false)

      expect(repo.updateCharacterCareer).toHaveBeenCalledWith('char-1', 'c1')
      expect(repo.replaceCharacterTotalAdvancedValues).not.toHaveBeenCalled()
      expect(deps.loadCharacter).toHaveBeenCalledOnce()
      expect(deps.setSectionSuccess).toHaveBeenCalledWith('career', 'Carrière mise à jour.')
      expect(api.changingCareer.value).toBe(false)
    })

    it('also replaces advanced values when characteristics are applied', async () => {
      const { api, deps } = setup()
      await prepareConfirm(api)

      await api.applyCareerChange(true)

      expect(repo.replaceCharacterTotalAdvancedValues).toHaveBeenCalledWith('char-1', { cc: 5 })
      expect(deps.setSectionSuccess).toHaveBeenCalledWith(
        'career',
        'Carrière et caractéristiques mises à jour.'
      )
    })

    it('reports refresh failure after all career writes succeed', async () => {
      const { api, deps } = setup()
      await prepareConfirm(api)
      deps.loadCharacter.mockRejectedValueOnce(new Error('reload'))

      await api.applyCareerChange(true)

      expect(repo.updateCharacterCareer).toHaveBeenCalledOnce()
      expect(repo.replaceCharacterTotalAdvancedValues).toHaveBeenCalledWith('char-1', { cc: 5 })
      expect(deps.loadCharacter).toHaveBeenCalledOnce()
      expect(api.careerConfirmError.value).toBe(
        'Carrière et caractéristiques mises à jour, mais actualisation impossible.'
      )
      expect(api.careerConfirmError.value).not.toContain('profil de carrière non appliqué')
      expect(deps.setSectionSuccess).not.toHaveBeenCalled()
      expect(api.changingCareer.value).toBe(false)
    })

    it('reports a plain error when the career update itself fails', async () => {
      const { api, deps } = setup()
      await prepareConfirm(api)
      repo.updateCharacterCareer.mockRejectedValueOnce(new Error('fail'))

      await api.applyCareerChange(true)

      expect(api.careerConfirmError.value).toBe('fail')
      expect(deps.loadCharacter).not.toHaveBeenCalled()
      expect(api.changingCareer.value).toBe(false)
    })

    it('uses a safe fallback when applying a career change fails before the write', async () => {
      const { api, deps } = setup()
      await prepareConfirm(api)
      repo.updateCharacterCareer.mockRejectedValueOnce({
        code: '42501',
        message: 'permission denied for table characters',
      })

      await api.applyCareerChange(true)

      expect(api.careerConfirmError.value).toBe('Modification de carrière impossible.')
      expect(api.careerConfirmError.value).not.toContain('characters')
      expect(deps.loadCharacter).not.toHaveBeenCalled()
      expect(api.changingCareer.value).toBe(false)
    })

    it('reloads and reports partial success when the profile update fails', async () => {
      const { api, deps } = setup()
      await prepareConfirm(api)
      repo.replaceCharacterTotalAdvancedValues.mockRejectedValueOnce({
        code: '42501',
        message: 'new row violates row-level security policy for table character_stats',
      })

      await api.applyCareerChange(true)

      expect(repo.updateCharacterCareer).toHaveBeenCalledOnce()
      expect(deps.loadCharacter).toHaveBeenCalledOnce()
      expect(api.careerConfirmError.value).toBe(
        'Carrière mise à jour, mais profil de carrière non appliqué.'
      )
      expect(api.careerConfirmError.value).not.toContain('character_stats')
      expect(deps.setSectionSuccess).not.toHaveBeenCalled()
      expect(api.changingCareer.value).toBe(false)
    })

    it('uses a generic partial message for non-Error rejections and tolerates reload failure', async () => {
      const { api, deps } = setup()
      await prepareConfirm(api)
      repo.replaceCharacterTotalAdvancedValues.mockRejectedValueOnce('x')
      deps.loadCharacter.mockRejectedValueOnce(new Error('reload'))

      await api.applyCareerChange(true)

      expect(api.careerConfirmError.value).toBe(
        'Carrière mise à jour, mais profil de carrière non appliqué.'
      )
    })
  })
})
