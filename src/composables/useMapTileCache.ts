import {
  MAP_TILE_CACHE_MAX_ENTRIES,
  MAP_TILE_CACHE_PREFIX,
  MAP_TILE_CACHE_VERSION,
} from '../config/map'
import { mapTileTable } from '../db/mapTileDb'
import { loadMapTileIndex } from '../services/mapTileIndexRepository'
import { fetchMapTile } from '../services/mapTilesRepository'
import { createTileCache, type TileCache } from '../utils/mapTileCache'
import { hasIndexedTile, type MapTileIndex } from '../utils/mapTileIndex'

let instance: TileCache | null = null
let tileIndex: MapTileIndex | null = null
let indexLoading: Promise<void> | null = null

/** Loads the availability index once; until it resolves (or if it fails) every tile is assumed present. */
export function loadMapTileAvailability(): Promise<void> {
  indexLoading ??= loadMapTileIndex().then((index) => {
    tileIndex = index
    if (!index) indexLoading = null
  })
  return indexLoading
}

/** App-wide tile cache so the map layer and the prefetch share in-flight requests. */
export function useMapTileCache(): TileCache {
  instance ??= createTileCache({
    version: MAP_TILE_CACHE_VERSION,
    cachePrefix: MAP_TILE_CACHE_PREFIX,
    maxEntries: MAP_TILE_CACHE_MAX_ENTRIES,
    table: mapTileTable,
    fetchTile: fetchMapTile,
    isAvailable: (coords) => !tileIndex || hasIndexedTile(tileIndex, coords),
  })
  return instance
}
