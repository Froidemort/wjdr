import { expect, test, describe } from 'vitest'
import {
  LocalCatalogProvider,
  RemoteCatalogProvider,
  CatalogService,
  createCatalogService,
  type Catalogs
} from '../../src/services/catalogProvider'

describe('catalog provider', () => {
  it('loads local catalogs with expected structure', async () => {
    const provider = new LocalCatalogProvider()
    const catalogs = await provider.load()

    expect(catalogs.version).toBe('1.0.0')
    expect(Array.isArray(catalogs.skills)).toBe(true)
    expect(catalogs.skills.length).toBeGreaterThan(0)
    expect(Array.isArray(catalogs.talents)).toBe(true)
    expect(catalogs.talents.length).toBeGreaterThan(0)
    expect(Array.isArray(catalogs.careers)).toBe(true)
    expect(catalogs.careers.length).toBeGreaterThan(0)
    expect(Array.isArray(catalogs.careerTransitions)).toBe(true)
  })

  it('validates career transitions structure', async () => {
    const provider = new LocalCatalogProvider()
    const catalogs = await provider.load()

    catalogs.careerTransitions.forEach((transition) => {
      expect(typeof transition.from).toBe('string')
      expect(Array.isArray(transition.to)).toBe(true)
      expect(transition.to.length).toBeGreaterThan(0)
    })
  })

  it('local catalog contains expected entries', async () => {
    const provider = new LocalCatalogProvider()
    const catalogs = await provider.load()

    const skillIds = catalogs.skills.map((s) => s.id)
    expect(skillIds).toContain('language-reikspiel')
    expect(skillIds).toContain('perception')

    const talentIds = catalogs.talents.map((t) => t.id)
    expect(talentIds).toContain('sixth-sense')

    expect(catalogs.careers).toContain('Apprenti Sorcier')
  })

  it('catalog service caches loaded catalogs', async () => {
    const service = new CatalogService()
    let callCount = 0

    const originalLoad = LocalCatalogProvider.prototype.load
    LocalCatalogProvider.prototype.load = async () => {
      callCount++
      return originalLoad.call(new LocalCatalogProvider())
    }

    try {
      const first = await service.getCatalogs()
      const second = await service.getCatalogs()

      expect(first).toEqual(second)
      expect(callCount).toBe(1)
    } finally {
      LocalCatalogProvider.prototype.load = originalLoad
    }
  })

  it('catalog service clears cache', async () => {
    const service = new CatalogService()
    const first = await service.getCatalogs()

    service.clearCache()

    const second = await service.getCatalogs()
    expect(first).toEqual(second)
  })

  it('remote provider validates catalog format', async () => {
    const mockUrl = 'http://example.com/catalogs'
    const provider = new RemoteCatalogProvider(mockUrl)

    const invalidCatalogs = [
      {},
      { version: '1.0.0' },
      { version: '1.0.0', skills: 'not-an-array' }
    ]

    for (const invalid of invalidCatalogs) {
      // Mock fetch would be needed in real scenario
      // For now we test the normalizeCatalogs method indirectly
      const method = (provider as any).normalizeCatalogs.bind(provider)
      expect(() => method(invalid)).toThrow()
    }
  })

  it('factory function creates catalog service', async () => {
    const service = createCatalogService()
    const catalogs = await service.getCatalogs()

    expect(catalogs.version).toBe('1.0.0')
    expect(catalogs.skills.length).toBeGreaterThan(0)
  })
})
