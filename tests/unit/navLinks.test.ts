import { describe, expect, it } from 'vitest'
import { compendiumSections } from '../../src/config/compendiumSections'
import { mainNavLinks, resolveNavTo } from '../../src/config/navLinks'

describe('compendium navigation', () => {
  it('exposes the compendium home to signed-out visitors', () => {
    const link = mainNavLinks.find((entry) => entry.label === 'Compendium')

    expect(link).toMatchObject({ to: '/compendium', public: true })
  })

  it('lists inventory, careers and spells sections', () => {
    expect(compendiumSections.map((section) => section.to)).toEqual([
      '/compendium/inventory',
      '/compendium/careers',
      '/compendium/spells',
    ])
  })

  it('includes the V2 skills and talents sections', () => {
    expect(compendiumSections.filter((section) => section.to.includes('/skills') || section.to.includes('/talents')).map((section) => section.to)).toEqual([
      '/compendium/skills',
      '/compendium/talents',
    ])
  })

  it('resolves dynamic targets from the current context', () => {
    const campaigns = mainNavLinks.find((entry) => entry.label === 'Campagnes')!
    const characters = mainNavLinks.find((entry) => entry.label === 'Personnages')!
    const empty = { role: null, campaignTo: null, characterTo: null }
    const player = { role: 'player' as const, campaignTo: '/campaigns/c1', characterTo: '/characters/k1' }
    const mj = { role: 'mj' as const, campaignTo: '/campaigns/c1', characterTo: null }

    expect(resolveNavTo(campaigns, empty)).toBe('/campaigns')
    expect(resolveNavTo(campaigns, player)).toBe('/campaigns/c1')
    expect(resolveNavTo(characters, player)).toBe('/characters/k1')
    expect(resolveNavTo(characters, mj)).toBe('/characters')
  })
})
