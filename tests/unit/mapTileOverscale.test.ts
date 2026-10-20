import { afterEach, describe, expect, it, vi } from 'vitest'
import { TileRequestError } from '../../src/utils/mapTileCache'
import { overscaleAncestorTile } from '../../src/utils/mapTileOverscale'

const drawImage = vi.fn()

function stubDom() {
  vi.stubGlobal('createImageBitmap', async () => ({ close: vi.fn() }))
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({ drawImage }), toBlob: (cb: (b: Blob) => void) => cb(new Blob(['out'])) }) })
}

afterEach(() => {
  vi.unstubAllGlobals()
  drawImage.mockReset()
})

describe('overscaleAncestorTile', () => {
  it('crops the matching quadrant of the parent tile', async () => {
    stubDom()
    const getTile = vi.fn().mockResolvedValue(new Blob(['p']))

    const blob = await overscaleAncestorTile({ getTile }, { z: 7, x: 51, y: 28 }, 256, 2, 2)

    expect(await blob?.text()).toBe('out')
    expect(getTile).toHaveBeenCalledWith({ z: 6, x: 25, y: 14 })
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 128, 0, 128, 128, 0, 0, 256, 256)
  })

  it('walks up to the grandparent when the parent is missing', async () => {
    stubDom()
    const getTile = vi.fn().mockRejectedValueOnce(new TileRequestError(404)).mockResolvedValueOnce(new Blob(['g']))

    await overscaleAncestorTile({ getTile }, { z: 7, x: 51, y: 28 }, 256, 2, 2)

    expect(getTile).toHaveBeenLastCalledWith({ z: 5, x: 12, y: 7 })
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 192, 0, 64, 64, 0, 0, 256, 256)
  })

  it('returns null when no ancestor is within range', async () => {
    const getTile = vi.fn().mockRejectedValue(new TileRequestError(404))

    expect(await overscaleAncestorTile({ getTile }, { z: 7, x: 0, y: 0 }, 256, 2, 2)).toBeNull()
    expect(await overscaleAncestorTile({ getTile }, { z: 2, x: 0, y: 0 }, 256, 2, 2)).toBeNull()
  })

  it('propagates non-missing errors', async () => {
    const getTile = vi.fn().mockRejectedValue(new TileRequestError(500))

    await expect(overscaleAncestorTile({ getTile }, { z: 7, x: 0, y: 0 }, 256, 2, 2)).rejects.toMatchObject({ status: 500 })
  })
})
