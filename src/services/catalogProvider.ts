import type { CatalogEntry } from '../domain/character.js'
import {
  CAREER_CATALOG as LOCAL_CAREER_CATALOG,
  SKILL_CATALOG as LOCAL_SKILL_CATALOG,
  TALENT_CATALOG as LOCAL_TALENT_CATALOG
} from '../domain/character.js'

export interface CareerTransition {
  from: string
  to: string[]
}

export interface Catalogs {
  version: string
  skills: CatalogEntry[]
  talents: CatalogEntry[]
  careers: string[]
  careerTransitions: CareerTransition[]
}

export interface CatalogProvider {
  load(): Promise<Catalogs>
}

const CATALOG_VERSION = '1.0.0'

const createLocalCatalogs = (): Catalogs => ({
  version: CATALOG_VERSION,
  skills: LOCAL_SKILL_CATALOG,
  talents: LOCAL_TALENT_CATALOG,
  careers: LOCAL_CAREER_CATALOG,
  careerTransitions: [
    {
      from: 'Apprenti Sorcier',
      to: ['Magicien', 'Inquisiteur']
    },
    {
      from: 'Combattant des tunnels',
      to: ['Guerrier vétéran', 'Chasseur de primes']
    },
    {
      from: 'Fanatique',
      to: ['Prêtre guerrier', 'Flagellant']
    }
  ]
})

export class LocalCatalogProvider implements CatalogProvider {
  async load(): Promise<Catalogs> {
    return createLocalCatalogs()
  }
}

export class RemoteCatalogProvider implements CatalogProvider {
  url: string

  constructor(url: string) {
    this.url = url
  }

  async load(): Promise<Catalogs> {
    try {
      const response = await fetch(this.url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json() as Catalogs
      return this.normalizeCatalogs(data)
    } catch (error) {
      console.warn(`Failed to load remote catalogs from ${this.url}:`, error)
      throw error
    }
  }

  private normalizeCatalogs(data: unknown): Catalogs {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid catalog format')
    }

    const obj = data as Record<string, unknown>

    if (typeof obj.version !== 'string') {
      throw new Error('Missing catalog version')
    }

    if (!Array.isArray(obj.skills) || !Array.isArray(obj.talents) || !Array.isArray(obj.careers)) {
      throw new Error('Missing catalog arrays')
    }

    return {
      version: obj.version,
      skills: obj.skills as CatalogEntry[],
      talents: obj.talents as CatalogEntry[],
      careers: obj.careers as string[],
      careerTransitions: Array.isArray(obj.careerTransitions)
        ? (obj.careerTransitions as CareerTransition[])
        : []
    }
  }
}

export class CatalogService {
  private cached: Catalogs | undefined
  private readonly localProvider = new LocalCatalogProvider()
  private readonly remoteProvider: RemoteCatalogProvider | undefined

  constructor(remoteUrl?: string) {
    if (remoteUrl) {
      this.remoteProvider = new RemoteCatalogProvider(remoteUrl)
    }
  }

  async getCatalogs(): Promise<Catalogs> {
    if (this.cached) {
      return this.cached
    }

    try {
      if (this.remoteProvider) {
        this.cached = await this.remoteProvider.load()
        return this.cached
      }
    } catch (error) {
      console.warn('Remote catalog load failed, falling back to local:', error)
    }

    this.cached = await this.localProvider.load()
    return this.cached
  }

  clearCache(): void {
    this.cached = undefined
  }
}

export const createCatalogService = (remoteUrl?: string): CatalogService =>
  new CatalogService(remoteUrl)
