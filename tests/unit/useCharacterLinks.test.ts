import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import type { CharacterDetail, CharacterItem, CharacterSkill } from '../../src/types/domain'

const deps = vi.hoisted(() => ({
  invalidateCharacterLinksCache: vi.fn(),
  listCharacterLinksBundle: vi.fn(),
  removeCharacterItem: vi.fn(),
  removeCharacterSkill: vi.fn(),
  removeCharacterTalent: vi.fn(),
  updateCharacterItemQuality: vi.fn(),
  updateCharacterItemQuantity: vi.fn(),
  updateCharacterSkillMastery: vi.fn(),
  confirmAction: vi.fn(),
}))

vi.mock('../../src/services/characterLinksRepository', () => deps)
vi.mock('../../src/composables/useConfirmAction', () => ({
  useConfirmAction: () => ({ confirmAction: deps.confirmAction }),
}))

import { useCharacterFeedback } from '../../src/composables/useCharacterFeedback'
import { useCharacterLinks } from '../../src/composables/useCharacterLinks'

function setup(options: { canEdit?: boolean; getCharacterId?: () => string } = {}) {
  const errorMessage = ref<string | null>(null)
  const feedback = useCharacterFeedback({ errorMessage })
  const character = ref({ id: 'char-1' } as CharacterDetail)
  const canEdit = computed(() => options.canEdit ?? true)
  const links = useCharacterLinks({
    character,
    getCharacterId: options.getCharacterId ?? (() => character.value?.id ?? ''),
    canEdit,
    errorMessage,
    feedback,
  })
  return { links, errorMessage, feedback }
}

const skill = (overrides: Partial<CharacterSkill> = {}): CharacterSkill => ({
  skillId: 's1',
  name: 'Esquive',
  statCode: 'Ag',
  specialization: null,
  description: null,
  masteryLevel: 1,
  isBasic: true,
  ...overrides,
})

const item = (overrides: Partial<CharacterItem> = {}): CharacterItem => ({
  id: 'i1',
  itemId: 'item-1',
  name: 'Corde',
  description: null,
  quality: 'normal',
  encumbrance: 1,
  quantity: 2,
  ...overrides,
})

describe('useCharacterLinks', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    deps.confirmAction.mockResolvedValue(true)
  })

  it('updates the skill mastery level and invalidates the cache', async () => {
    const { links } = setup()
    links.characterSkills.value = [skill()]

    await links.onChangeSkillMastery('s1', 2)

    expect(deps.updateCharacterSkillMastery).toHaveBeenCalledWith('char-1', 's1', 2)
    expect(links.characterSkills.value[0].masteryLevel).toBe(2)
    expect(deps.invalidateCharacterLinksCache).toHaveBeenCalledWith('char-1')
  })

  it('does nothing when the mastery level is unchanged', async () => {
    const { links } = setup()
    links.characterSkills.value = [skill({ masteryLevel: 2 })]

    await links.onChangeSkillMastery('s1', 2)

    expect(deps.updateCharacterSkillMastery).not.toHaveBeenCalled()
  })

  it('ignores mastery changes when canEdit is false', async () => {
    const { links } = setup({ canEdit: false })
    links.characterSkills.value = [skill()]

    await links.onChangeSkillMastery('s1', 2)

    expect(deps.updateCharacterSkillMastery).not.toHaveBeenCalled()
  })

  it('deletes a skill then reloads the links', async () => {
    deps.removeCharacterSkill.mockResolvedValue(undefined)
    deps.listCharacterLinksBundle.mockResolvedValue({
      skills: [],
      talents: [],
      weapons: [],
      armors: [],
      items: [],
    })
    const { links, feedback } = setup()

    await links.onDeleteSkill('s1')

    expect(deps.removeCharacterSkill).toHaveBeenCalledWith('char-1', 's1')
    expect(deps.listCharacterLinksBundle).toHaveBeenCalledWith('char-1', { force: true })
    expect(feedback.getSectionSuccessMessage('skills')).toBe('Compétence supprimée.')
  })

  it('refuses to delete a talent while another action is busy', async () => {
    const { links, feedback } = setup()
    feedback.beginAction('busy')

    await links.onDeleteTalent('t1')

    expect(deps.removeCharacterTalent).not.toHaveBeenCalled()
  })

  it('reports a refresh failure after a successful item delete', async () => {
    deps.removeCharacterItem.mockResolvedValue(undefined)
    deps.listCharacterLinksBundle.mockRejectedValue(new Error('down'))
    const { links, errorMessage } = setup()

    await links.onDeleteItem('i1')

    expect(deps.removeCharacterItem).toHaveBeenCalledWith('i1')
    expect(errorMessage.value).toBe('Actualisation impossible, rechargez la page.')
  })

  it('increments the item quantity', async () => {
    deps.updateCharacterItemQuantity.mockResolvedValue(undefined)
    const { links } = setup()
    links.characterItems.value = [item({ quantity: 2 })]

    await links.onChangeItemQuantity(links.characterItems.value[0], 1)

    expect(deps.updateCharacterItemQuantity).toHaveBeenCalledWith('i1', 3)
    expect(links.characterItems.value[0].quantity).toBe(3)
  })

  it('floors the item quantity at 1', async () => {
    deps.updateCharacterItemQuantity.mockResolvedValue(undefined)
    const { links } = setup()
    links.characterItems.value = [item({ quantity: 3 })]

    await links.onChangeItemQuantity(links.characterItems.value[0], -10)

    expect(deps.updateCharacterItemQuantity).toHaveBeenCalledWith('i1', 1)
  })

  it('does not call the repository when the quantity does not change', async () => {
    const { links } = setup()
    links.characterItems.value = [item({ quantity: 1 })]

    await links.onChangeItemQuantity(links.characterItems.value[0], -1)

    expect(deps.updateCharacterItemQuantity).not.toHaveBeenCalled()
  })

  it('updates the item quality', async () => {
    deps.updateCharacterItemQuality.mockResolvedValue(undefined)
    const { links } = setup()
    links.characterItems.value = [item({ quality: 'normal' })]

    await links.onItemQualityChange(links.characterItems.value[0], 'bonne')

    expect(deps.updateCharacterItemQuality).toHaveBeenCalledWith('i1', 'bonne')
    expect(links.characterItems.value[0].quality).toBe('bonne')
  })

  it('ignores an invalid item quality value', async () => {
    const { links } = setup()
    links.characterItems.value = [item()]

    await links.onItemQualityChange(links.characterItems.value[0], true)

    expect(deps.updateCharacterItemQuality).not.toHaveBeenCalled()
  })

  it('sorts loaded links by name', async () => {
    deps.listCharacterLinksBundle.mockResolvedValue({
      skills: [skill({ name: 'Natation' }), skill({ skillId: 's2', name: 'Athlétisme' })],
      talents: [],
      weapons: [],
      armors: [],
      items: [],
    })
    const { links } = setup()

    await links.loadCharacterLinks('char-1')

    expect(links.sortedCharacterSkills.value.map((s) => s.name)).toEqual([
      'Athlétisme',
      'Natation',
    ])
  })

  it('does nothing when invalidating the cache without a character id', () => {
    const { links } = setup({ getCharacterId: () => '' })

    links.invalidateCurrentLinksCache()

    expect(deps.invalidateCharacterLinksCache).not.toHaveBeenCalled()
  })

  it('reports an error when updating the skill mastery fails', async () => {
    deps.updateCharacterSkillMastery.mockRejectedValue(new Error('down'))
    const { links, errorMessage } = setup()
    links.characterSkills.value = [skill()]

    await links.onChangeSkillMastery('s1', 2)

    expect(errorMessage.value).toBe('down')
  })

  it('refuses to delete a skill while another action is busy', async () => {
    const { links, feedback } = setup()
    feedback.beginAction('busy')

    await links.onDeleteSkill('s1')

    expect(deps.removeCharacterSkill).not.toHaveBeenCalled()
  })

  it('cancels skill deletion when the confirmation is dismissed', async () => {
    deps.confirmAction.mockResolvedValue(false)
    const { links } = setup()

    await links.onDeleteSkill('s1')

    expect(deps.removeCharacterSkill).not.toHaveBeenCalled()
  })

  it('reports an error when deleting a skill fails', async () => {
    deps.removeCharacterSkill.mockRejectedValue(new Error('down'))
    const { links, errorMessage } = setup()

    await links.onDeleteSkill('s1')

    expect(errorMessage.value).toBe('down')
  })

  it('cancels talent deletion when the confirmation is dismissed', async () => {
    deps.confirmAction.mockResolvedValue(false)
    const { links } = setup()

    await links.onDeleteTalent('t1')

    expect(deps.removeCharacterTalent).not.toHaveBeenCalled()
  })

  it('deletes a talent then reloads the links', async () => {
    deps.removeCharacterTalent.mockResolvedValue(undefined)
    deps.listCharacterLinksBundle.mockResolvedValue({
      skills: [],
      talents: [],
      weapons: [],
      armors: [],
      items: [],
    })
    const { links, feedback } = setup()

    await links.onDeleteTalent('t1')

    expect(deps.removeCharacterTalent).toHaveBeenCalledWith('char-1', 't1')
    expect(feedback.getSectionSuccessMessage('talents')).toBe('Talent supprimé.')
  })

  it('reports an error when deleting a talent fails', async () => {
    deps.removeCharacterTalent.mockRejectedValue(new Error('down'))
    const { links, errorMessage } = setup()

    await links.onDeleteTalent('t1')

    expect(errorMessage.value).toBe('down')
  })

  it('refuses to delete an item while another action is busy', async () => {
    const { links, feedback } = setup()
    feedback.beginAction('busy')

    await links.onDeleteItem('i1')

    expect(deps.removeCharacterItem).not.toHaveBeenCalled()
  })

  it('cancels item deletion when the confirmation is dismissed', async () => {
    deps.confirmAction.mockResolvedValue(false)
    const { links } = setup()

    await links.onDeleteItem('i1')

    expect(deps.removeCharacterItem).not.toHaveBeenCalled()
  })

  it('reports an error when deleting an item fails', async () => {
    deps.removeCharacterItem.mockRejectedValue(new Error('down'))
    const { links, errorMessage } = setup()

    await links.onDeleteItem('i1')

    expect(errorMessage.value).toBe('down')
  })

  it('ignores item quantity changes when canEdit is false', async () => {
    const { links } = setup({ canEdit: false })
    links.characterItems.value = [item()]

    await links.onChangeItemQuantity(links.characterItems.value[0], 1)

    expect(deps.updateCharacterItemQuantity).not.toHaveBeenCalled()
  })

  it('refuses to change the item quantity while another action is busy', async () => {
    const { links, feedback } = setup()
    feedback.beginAction('busy')
    links.characterItems.value = [item()]

    await links.onChangeItemQuantity(links.characterItems.value[0], 1)

    expect(deps.updateCharacterItemQuantity).not.toHaveBeenCalled()
  })

  it('reports an error when updating the item quantity fails', async () => {
    deps.updateCharacterItemQuantity.mockRejectedValue(new Error('down'))
    const { links, errorMessage } = setup()
    links.characterItems.value = [item()]

    await links.onChangeItemQuantity(links.characterItems.value[0], 1)

    expect(errorMessage.value).toBe('down')
  })

  it('ignores item quality changes when canEdit is false', async () => {
    const { links } = setup({ canEdit: false })
    links.characterItems.value = [item()]

    await links.onItemQualityChange(links.characterItems.value[0], 'bonne')

    expect(deps.updateCharacterItemQuality).not.toHaveBeenCalled()
  })

  it('does not call the repository when the item quality does not change', async () => {
    const { links } = setup()
    links.characterItems.value = [item({ quality: 'normal' })]

    await links.onItemQualityChange(links.characterItems.value[0], 'normal')

    expect(deps.updateCharacterItemQuality).not.toHaveBeenCalled()
  })

  it('reports an error when updating the item quality fails', async () => {
    deps.updateCharacterItemQuality.mockRejectedValue(new Error('down'))
    const { links, errorMessage } = setup()
    links.characterItems.value = [item()]

    await links.onItemQualityChange(links.characterItems.value[0], 'bonne')

    expect(errorMessage.value).toBe('down')
  })

  it('sorts talents, weapons, armors and items by name', async () => {
    deps.listCharacterLinksBundle.mockResolvedValue({
      skills: [],
      talents: [
        { talentId: 't1', name: 'Zélé', specialization: null, description: null },
        { talentId: 't2', name: 'Acharné', specialization: null, description: null },
      ],
      weapons: [
        {
          id: 'w1',
          weaponId: 'weapon-1',
          name: 'Hache',
          description: null,
          equipped: null,
          quality: 'normal',
          encumbrance: 1,
          damageFormula: null,
          attributes: [],
        },
        {
          id: 'w2',
          weaponId: 'weapon-2',
          name: 'Épée',
          description: null,
          equipped: null,
          quality: 'normal',
          encumbrance: 1,
          damageFormula: null,
          attributes: [],
        },
      ],
      armors: [
        {
          id: 'a1',
          armorId: 'armor-1',
          name: 'Cotte',
          description: null,
          isEquipped: false,
          quality: 'normal',
          encumbrance: 1,
          armorPoints: 1,
        },
        {
          id: 'a2',
          armorId: 'armor-2',
          name: 'Casque',
          description: null,
          isEquipped: false,
          quality: 'normal',
          encumbrance: 1,
          armorPoints: 1,
        },
      ],
      items: [item({ id: 'i1', name: 'Torche' }), item({ id: 'i2', name: 'Corde' })],
    })
    const { links } = setup()

    await links.loadCharacterLinks('char-1')

    expect(links.sortedCharacterTalents.value.map((t) => t.name)).toEqual(['Acharné', 'Zélé'])
    expect(links.sortedCharacterWeapons.value.map((w) => w.name)).toEqual(['Épée', 'Hache'])
    expect(links.sortedCharacterArmors.value.map((a) => a.name)).toEqual(['Casque', 'Cotte'])
    expect(links.sortedCharacterItems.value.map((i) => i.name)).toEqual(['Corde', 'Torche'])
  })
})
