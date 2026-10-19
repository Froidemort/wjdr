import type { TileCache, TileCoords } from './mapTileCache'
import { TileRequestError } from './mapTileCache'

/** Crops and upscales the nearest available ancestor tile (up to `maxLevels` zooms up) to stand in for a missing tile. */
export async function overscaleAncestorTile(cache: Pick<TileCache, 'getTile'>, coords: TileCoords, tileSize: number, minZoom: number, maxLevels: number): Promise<Blob | null> {
  for (let level = 1; level <= maxLevels && coords.z - level >= minZoom; level += 1) {
    const parent: TileCoords = { z: coords.z - level, x: coords.x >> level, y: coords.y >> level }

    let blob: Blob
    try {
      blob = await cache.getTile(parent)
    } catch (error) {
      if (error instanceof TileRequestError && (error.status === 404 || error.status === 400)) continue
      throw error
    }

    const span = 2 ** level
    const sourceSize = tileSize / span
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = tileSize
    canvas.height = tileSize
    canvas.getContext('2d')?.drawImage(bitmap, (coords.x % span) * sourceSize, (coords.y % span) * sourceSize, sourceSize, sourceSize, 0, 0, tileSize, tileSize)
    bitmap.close()

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  }

  return null
}
