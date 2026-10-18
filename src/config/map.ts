// Tiles: XYZ 256px, zoom 2-7, Web Mercator (Leaflet default EPSG:3857), same as the wjrf reference map.
export const MAP_TILE_SIZE = 256
export const MAP_MIN_ZOOM = 2
export const MAP_MAX_ZOOM = 7
export const MAP_DEFAULT_ZOOM = 3
/** [lat, lng] */
export const MAP_DEFAULT_CENTER: readonly [number, number] = [66.5, -31]
/** [[south, west], [north, east]]; the tile set is not wrapped horizontally. */
export const MAP_BOUNDS: readonly [readonly [number, number], readonly [number, number]] = [
  [-85.0511, -180],
  [85.0511, 180],
]
export const MAP_MAX_LAT = 85.0511
export const MAP_ATTRIBUTION = '&copy; Gitzman, Blicher &amp; Nunez'

export const MAP_TILE_CACHE_PREFIX = 'wjdr-map-tiles'
/** Bump when the tile set is replaced so clients drop the old cache. */
export const MAP_TILE_CACHE_VERSION = 'v1'
export const MAP_TILE_CACHE_MAX_ENTRIES = 4000

/** URL template with {z}/{x}/{y}, e.g. https://<ref>.supabase.co/storage/v1/object/public/map-tiles/{z}/{x}/{y}.png */
export function getMapTilesUrl(): string | null {
  const raw: string | undefined = import.meta.env.VITE_MAP_TILES_URL
  const value = raw?.trim()
  return value ? value : null
}
