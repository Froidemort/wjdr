// Tiles: XYZ 256px, zoom 2-7, Web Mercator (Leaflet default EPSG:3857), same as the wjrf reference map.
export const MAP_TILE_SIZE = 256
export const MAP_MIN_ZOOM = 2
export const MAP_MAX_ZOOM = 7
export const MAP_DEFAULT_ZOOM = 3
/** A missing tile is drawn from an ancestor at most this many zooms up. */
export const MAP_OVERSCALE_LEVELS = 2
/** [lat, lng] */
export const MAP_DEFAULT_CENTER: readonly [number, number] = [66.5, -31]
/** [[south, west], [north, east]]; the tile set is not wrapped horizontally. */
export const MAP_BOUNDS: readonly [readonly [number, number], readonly [number, number]] = [
  [-85.0511, -180],
  [85.0511, 180],
]
export const MAP_MAX_LAT = 85.0511

export const MAP_TILE_CACHE_PREFIX = 'wjdr-map-tiles'
/** Bump when the tile set is replaced so clients drop the old cache. */
export const MAP_TILE_CACHE_VERSION = 'v2'
/** Full pyramid z2-7 is 21840 tiles; 10000 holds the z2-5 prefetch (1360) plus recently viewed z6-7 tiles. */
export const MAP_TILE_CACHE_MAX_ENTRIES = 10000

export const MAP_TILE_BUCKET = 'map-tiles'
export const MAP_TILE_FORMAT = 'jpg'

/** Offline prefetch covers z2..5 (16 + 64 + 256 + 1024 tiles). */
export const MAP_PREFETCH_MAX_ZOOM = 5
export const MAP_PREFETCH_CONCURRENCY = 6

/** Authenticated Supabase Storage URL of a tile (private bucket); null when the project URL is missing. */
export function getMapTileUrl(z: number, x: number, y: number): string | null {
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/+$/, '')
  return base ? `${base}/storage/v1/object/authenticated/${MAP_TILE_BUCKET}/${z}/${x}/${y}.${MAP_TILE_FORMAT}` : null
}
