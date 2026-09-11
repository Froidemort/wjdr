import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('../../src/db/supabase', () => ({ supabase: { from: fromMock } }))

import {
  addCharacterArmors, addCharacterItems, addCharacterSkills, addCharacterTalents, addCharacterWeapons,
  invalidateCharacterLinksCache, listCharacterArmors, listCharacterItems, listCharacterLinksBundle,
  listCharacterSkills, listCharacterTalents, listCharacterWeapons, removeCharacterArmor,
  removeCharacterItem, removeCharacterSkill, removeCharacterTalent, removeCharacterWeapon,
  updateCharacterArmorEquipped, updateCharacterArmorQuality, updateCharacterItemQuality,
  updateCharacterItemQuantity, updateCharacterSkillMastery, updateCharacterWeaponEquipped,
  updateCharacterWeaponQuality,
} from '../../src/services/characterLinksRepository'

function builder(data: unknown[] = [], error: Error | null = null) {
  return createSupabaseQueryBuilder({ data, error })
}

describe('characterLinksRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
    invalidateCharacterLinksCache()
  })

  it('enrichit les compétences du bundle et retourne une copie du cache', async () => {
    const builders = {
      character_skills: builder([{ skill_id: 'skill-1', mastery_level: 2, skills: { name: 'Athlétisme', stat_code: 'F', specialization: null, description: null, is_basic: false } }]),
      character_talents: builder([{ talent_id: 'talent-2', talents: { name: 'Zèle', specialization: null, description: null } }, { talent_id: 'talent-1', talents: { name: 'Acrobate', specialization: null, description: null } }]),
      character_weapons: builder(), character_armors: builder(), character_items: builder(),
      skills_talents: builder([{ skill_id: 'skill-1', talent_id: 'talent-2' }, { skill_id: 'skill-1', talent_id: 'talent-1' }, { skill_id: 'skill-1', talent_id: 'missing' }]),
    }
    fromMock.mockImplementation((table: keyof typeof builders) => builders[table])
    const first = await listCharacterLinksBundle('character-1')
    first.skills[0].name = 'Modifiée'
    const cached = await listCharacterLinksBundle('character-1')
    expect(cached.skills[0]).toMatchObject({ name: 'Athlétisme', linkedTalents: [{ talentId: 'talent-1' }, { talentId: 'talent-2' }] })
    expect(fromMock).toHaveBeenCalledTimes(6)
  })

  it.each([
    ['skills', listCharacterSkills, 'character_skills', [{ skill_id: 'skill-1', mastery_level: 1, skills: [{ name: 'Savoir', stat_code: 'INT', specialization: 'Empire', description: 'Desc.', is_basic: true }] }], [{ name: 'Savoir', statCode: 'INT', isBasic: true }]],
    ['talents', listCharacterTalents, 'character_talents', [{ talent_id: 'talent-1', talents: null }], [{ name: 'Talent inconnu', specialization: null }]],
    ['weapons', listCharacterWeapons, 'character_weapons', [{ id: 'weapon-link', weapon_id: 'weapon-1', quality: 'exceptionelle', equiped: 'droite', weapons: [{ name: 'Épée', description: null, encumbrance: 5, damage_formula: '+4', weapon_attribute_mappings: [{ attribute_id: 'a', weapon_attributes: [{ id: 'a', name: 'Rapide', description: null }] }, { attribute_id: 'a', weapon_attributes: { id: 'a', name: 'Rapide', description: null } }] }] }, { id: 'unknown-link', weapon_id: 'weapon-2', quality: 'invalid', equiped: null, weapons: null }], [{ name: 'Épée', quality: 'exceptionelle', encumbrance: 5, attributes: [{ id: 'a', name: 'Rapide' }] }, { name: 'Arme inconnue', quality: 'normal', encumbrance: 0 }]],
    ['armors', listCharacterArmors, 'character_armors', [{ id: 'armor-link', armor_id: 'armor-1', quality: 'médiocre', is_equipped: true, armors: [{ name: 'Cotte', description: null, covered_locations: ['torse'], encumbrance: 2, armor_points: 3 }] }, { id: 'unknown-link', armor_id: 'armor-2', quality: 'bonne', is_equipped: false, armors: null }], [{ name: 'Cotte', encumbrance: 3, isEquipped: true }, { name: 'Armure inconnue', encumbrance: 0, armorPoints: 0 }]],
    ['items', listCharacterItems, 'character_items', [{ id: 'item-link', item_id: 'item-1', quality: 'bonne', quantity: null, items: [{ name: 'Corde', description: null, encumbrance: 1 }] }, { id: 'unknown-link', item_id: 'item-2', quality: 'invalid', quantity: 3, items: null }], [{ name: 'Corde', quantity: 1, quality: 'bonne' }, { name: 'Équipement inconnu', encumbrance: 0, quality: 'normal', quantity: 3 }]],
  ] as const)('lit et normalise les liens %s', async (_, list, table, data, expected) => {
    const queryBuilder = builder(data)
    fromMock.mockReturnValue(queryBuilder)
    await expect(list('character-1')).resolves.toMatchObject(expected)
    expect(fromMock).toHaveBeenCalledWith(table)
    expect(queryBuilder.eq).toHaveBeenCalledWith('character_id', 'character-1')
    expect(queryBuilder.order).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['add skills', () => addCharacterSkills('character-1', ['skill-1', '', 'skill-1']), 'character_skills', 'upsert', [{ character_id: 'character-1', skill_id: 'skill-1', mastery_level: 1 }]],
    ['update skill', () => updateCharacterSkillMastery('character-1', 'skill-1', 3), 'character_skills', 'update', { mastery_level: 3 }], ['remove skill', () => removeCharacterSkill('character-1', 'skill-1'), 'character_skills', 'delete', null],
    ['add talents', () => addCharacterTalents('character-1', ['talent-1', '', 'talent-1']), 'character_talents', 'upsert', [{ character_id: 'character-1', talent_id: 'talent-1' }]], ['remove talent', () => removeCharacterTalent('character-1', 'talent-1'), 'character_talents', 'delete', null],
    ['add weapons', () => addCharacterWeapons('character-1', ['weapon-1'], 'bonne'), 'character_weapons', 'insert', [{ character_id: 'character-1', weapon_id: 'weapon-1', quality: 'bonne' }]], ['equip weapon', () => updateCharacterWeaponEquipped('weapon-link', 'gauche'), 'character_weapons', 'update', { equiped: 'gauche' }], ['update weapon quality', () => updateCharacterWeaponQuality('weapon-link', 'médiocre'), 'character_weapons', 'update', { quality: 'médiocre' }], ['remove weapon', () => removeCharacterWeapon('weapon-link'), 'character_weapons', 'delete', null],
    ['add armors', () => addCharacterArmors('character-1', ['armor-1'], 'bonne'), 'character_armors', 'insert', [{ character_id: 'character-1', armor_id: 'armor-1', quality: 'bonne', is_equipped: false }]], ['equip armor', () => updateCharacterArmorEquipped('armor-link', true), 'character_armors', 'update', { is_equipped: true }], ['update armor quality', () => updateCharacterArmorQuality('armor-link', 'exceptionelle'), 'character_armors', 'update', { quality: 'exceptionelle' }], ['remove armor', () => removeCharacterArmor('armor-link'), 'character_armors', 'delete', null],
    ['add items', () => addCharacterItems('character-1', ['item-1'], 2.8, 'bonne'), 'character_items', 'insert', [{ character_id: 'character-1', item_id: 'item-1', quality: 'bonne', quantity: 2 }]], ['update item quantity', () => updateCharacterItemQuantity('item-link', -3.2), 'character_items', 'update', { quantity: 1 }], ['update item quality', () => updateCharacterItemQuality('item-link', 'médiocre'), 'character_items', 'update', { quality: 'médiocre' }], ['remove item', () => removeCharacterItem('item-link'), 'character_items', 'delete', null],
  ] as const)('%s applique la mutation attendue', async (_, operation, table, method, payload) => {
    const queryBuilder = builder()
    fromMock.mockReturnValue(queryBuilder)
    await expect(operation()).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith(table)
    if (method === 'upsert') {
      expect(queryBuilder.upsert).toHaveBeenCalledWith(
        payload,
        expect.objectContaining({ ignoreDuplicates: true })
      )
      return
    }
    expect(queryBuilder[method]).toHaveBeenCalledWith(...(payload === null ? [] : [payload]))
  })

  it('ignore les ajouts sans identifiant et propage les erreurs Supabase', async () => {
    await expect(addCharacterWeapons('character-1', ['', ''])).resolves.toBeUndefined()
    expect(fromMock).not.toHaveBeenCalled()
    const error = new Error('database failure')
    fromMock.mockReturnValue(builder([], error))
    await expect(listCharacterItems('character-1')).rejects.toThrow(error)
  })

  it('force le rechargement et invalide selectivement le cache', async () => {
    const builders = {
      character_skills: builder(), character_talents: builder(), character_weapons: builder(), character_armors: builder(), character_items: builder(),
    }
    fromMock.mockImplementation((table: keyof typeof builders) => builders[table])
    await listCharacterLinksBundle('character-1')
    await listCharacterLinksBundle('character-1', { force: true })
    invalidateCharacterLinksCache('character-1')
    await listCharacterLinksBundle('character-1')
    expect(fromMock).toHaveBeenCalledTimes(15)
  })

  it.each([
    ['competence', () => addCharacterSkills('character-1', ['skill-1']), 'character_skills'],
    ['talent', () => addCharacterTalents('character-1', ['talent-1']), 'character_talents'],
    ['arme', () => addCharacterWeapons('character-1', ['weapon-1']), 'character_weapons'],
    ['armure', () => addCharacterArmors('character-1', ['armor-1']), 'character_armors'],
    ['objet', () => addCharacterItems('character-1', ['item-1']), 'character_items'],
    ['maitrise', () => updateCharacterSkillMastery('character-1', 'skill-1', 2), 'character_skills'],
    ['equipement arme', () => updateCharacterWeaponEquipped('weapon-link', null), 'character_weapons'],
    ['equipement armure', () => updateCharacterArmorEquipped('armor-link', false), 'character_armors'],
    ['quantite', () => updateCharacterItemQuantity('item-link', 2), 'character_items'],
    ['suppression arme', () => removeCharacterWeapon('weapon-link'), 'character_weapons'],
  ] as const)('propage une erreur de mutation pour %s', async (_name, operation, table) => {
    fromMock.mockImplementation((requestedTable) => {
      if (requestedTable === table) return builder([], new Error('mutation echouee'))
      throw new Error(`Unexpected table ${requestedTable}`)
    })
    await expect(operation()).rejects.toThrow('mutation echouee')
  })

  it('ne charge pas les relations lorsque le bundle ne contient aucune competence', async () => {
    const builders = {
      character_skills: builder(), character_talents: builder(), character_weapons: builder(), character_armors: builder(), character_items: builder(),
    }
    fromMock.mockImplementation((table: keyof typeof builders) => builders[table])
    await expect(listCharacterLinksBundle('sans-competence')).resolves.toMatchObject({ skills: [] })
    expect(fromMock).toHaveBeenCalledTimes(5)
  })
})
