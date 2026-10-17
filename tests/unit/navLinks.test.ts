import { describe, expect, it } from 'vitest'
import { compendiumSections } from '../../src/config/compendiumSections'
import { mainNavLinks } from '../../src/config/navLinks'

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
})
