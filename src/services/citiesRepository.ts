import type { City } from '../types/cities'

const CITIES_URL = '/data/cities.json'

let pending: Promise<City[]> | null = null

function isCity(value: unknown): value is City {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Partial<City>
  return typeof row.id === 'number' && typeof row.name === 'string' && Number.isFinite(row.lat) && Number.isFinite(row.lng)
}

/** Static dataset fetched once per page load (HTTP cache handles repeat visits); hidden towns are dropped. */
export function listCities(): Promise<City[]> {
  pending ??= fetch(CITIES_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Cities request failed (${response.status}).`)
      return response.json() as Promise<unknown>
    })
    .then((data) => (Array.isArray(data) ? data.filter(isCity).filter((city) => !city.hidden) : []))
    .catch((error: unknown) => {
      pending = null
      throw error
    })

  return pending
}
