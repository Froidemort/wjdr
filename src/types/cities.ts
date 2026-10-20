/** Town from the wjrf map; lat/lng are WGS84 degrees, directly usable with the Web Mercator tiles. */
export interface City {
  id: number
  name: string
  lat: number
  lng: number
  type: string | null
  population: number | null
  region: string | null
  country: string | null
  subregion: string | null
  url: string | null
  /** Awaiting validation on the source site (no details). */
  pending: boolean
  /** Hidden by default on the source map. */
  hidden: boolean
  source: string | null
}
