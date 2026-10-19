import { parseTileIndex, type MapTileIndex } from '../utils/mapTileIndex'

const INDEX_URL = '/data/map-tiles-index.json'

/** Static availability index; null on any failure, in which case every tile is requested as before. */
export async function loadMapTileIndex(): Promise<MapTileIndex | null> {
  try {
    const response = await fetch(INDEX_URL)
    return response.ok ? parseTileIndex(await response.json()) : null
  } catch {
    return null
  }
}
