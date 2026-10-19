import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class MapTilesAuthError extends Error {}
  const hooks: { mounted?: () => Promise<void> } = {}
  const layers: Array<{ createTile: (coords: { z: number; x: number; y: number }, done: (e?: Error, t?: unknown) => void) => unknown }> = []
  const markers: Array<{ bindTooltip: ReturnType<typeof vi.fn> }> = []
  const selections: Array<{ latlng: [number, number]; remove: ReturnType<typeof vi.fn> }> = []
  const chain = () => ({ addTo: vi.fn().mockReturnThis(), clearLayers: vi.fn(), on: vi.fn().mockReturnThis() })

  class TileLayer {
    constructor() {
      layers.push(this as unknown as (typeof layers)[number])
    }
    addTo() {
      return this
    }
    bringToBack() {}
    remove() {}
  }

  const leaflet = {
    TileLayer,
    CRS: { EPSG3857: {} },
    map: () => ({ on: vi.fn(), remove: vi.fn(), getZoom: () => 3, flyTo: vi.fn(), invalidateSize: vi.fn() }),
    canvas: () => ({}),
    divIcon: (options: object) => options,
    marker: (latlng: [number, number]) => {
      const selection = { latlng, remove: vi.fn(), addTo: vi.fn().mockReturnThis() }
      selections.push(selection)
      return selection
    },
    layerGroup: chain,
    circleMarker: () => {
      const marker = { ...chain(), bindTooltip: vi.fn() }
      markers.push(marker)
      return marker
    },
  }

  return {
    MapTilesAuthError,
    hooks,
    layers,
    markers,
    selections,
    leaflet,
    cache: { getTile: vi.fn(), purgeOldVersions: vi.fn().mockResolvedValue(undefined) },
    auth: { isAuthenticated: undefined as unknown, initialized: undefined as unknown },
  }
})

vi.mock('vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue')>()),
  onMounted: (fn: () => Promise<void>) => {
    mocks.hooks.mounted = fn
  },
  onBeforeUnmount: vi.fn(),
}))
vi.mock('leaflet', () => mocks.leaflet)
vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('../../src/services/mapTilesRepository', () => ({ MapTilesAuthError: mocks.MapTilesAuthError }))
vi.mock('../../src/composables/useMapTileCache', () => ({ useMapTileCache: () => mocks.cache, loadMapTileAvailability: () => Promise.resolve() }))
vi.mock('../../src/stores/auth', () => ({ useAuthStore: () => mocks.auth }))

import { useLeafletMap } from '../../src/composables/useLeafletMap'
import { TileRequestError } from '../../src/utils/mapTileCache'

interface FakeElement {
  textContent: string
  onload?: () => void
  onerror?: () => void
  setAttribute: () => void
  innerHTML?: string
  src?: string
}

function fakeElement(): FakeElement {
  const html = vi.fn()
  const element: FakeElement = { textContent: '', setAttribute: () => {} }
  Object.defineProperty(element, 'innerHTML', { set: html, get: () => '' })
  Object.defineProperty(element, 'src', {
    set() {
      queueMicrotask(() => element.onload?.())
    },
    get: () => '',
  })
  return element
}

async function mount(authenticated = true) {
  mocks.auth.isAuthenticated = ref(authenticated)
  mocks.auth.initialized = ref(true)
  const result = useLeafletMap(ref({} as HTMLElement), { onSelect: vi.fn(), onContextMenu: vi.fn() })
  await mocks.hooks.mounted?.()
  return result
}

function tileDone() {
  return new Promise<{ error?: Error }>((resolve) => {
    const [layer] = mocks.layers
    layer.createTile({ z: 2, x: 0, y: 0 }, (error) => resolve({ error }))
  })
}

describe('useLeafletMap', () => {
  beforeEach(() => {
    mocks.layers.length = 0
    mocks.markers.length = 0
    mocks.selections.length = 0
    mocks.hooks.mounted = undefined
    mocks.cache.getTile.mockReset()
    vi.stubGlobal('document', { createElement: fakeElement })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sets authRequired on MapTilesAuthError', async () => {
    mocks.cache.getTile.mockRejectedValue(new mocks.MapTilesAuthError())
    const { authRequired } = await mount()

    const { error } = await tileDone()

    expect(error).toBeInstanceOf(mocks.MapTilesAuthError)
    expect(authRequired.value).toBe(true)
  })

  it('does not set authRequired on other tile errors', async () => {
    mocks.cache.getTile.mockRejectedValue(new Error('404'))
    const { authRequired } = await mount()

    await tileDone()

    expect(authRequired.value).toBe(false)
  })

  it('draws a missing tile from its ancestor instead of leaving a hole', async () => {
    mocks.cache.getTile.mockRejectedValueOnce(new TileRequestError(404)).mockRejectedValueOnce(new TileRequestError(400)).mockResolvedValueOnce(new Blob(['x']))
    vi.stubGlobal('createImageBitmap', async () => ({ close: vi.fn() }))
    vi.stubGlobal('document', {
      createElement: (tag: string) =>
        tag === 'canvas' ? { getContext: () => ({ drawImage: vi.fn() }), toBlob: (cb: (b: Blob) => void) => cb(new Blob(['y'])) } : fakeElement(),
    })
    await mount()

    const { error } = await new Promise<{ error?: Error }>((resolve) => {
      mocks.layers[0].createTile({ z: 7, x: 51, y: 28 }, (e) => resolve({ error: e }))
    })

    expect(error).toBeUndefined()
    expect(mocks.cache.getTile.mock.calls.map(([c]) => c)).toEqual([{ z: 7, x: 51, y: 28 }, { z: 6, x: 25, y: 14 }, { z: 5, x: 12, y: 7 }])
  })

  it('reports the tile error when no ancestor exists', async () => {
    mocks.cache.getTile.mockRejectedValue(new TileRequestError(404))
    await mount()

    const { error } = await new Promise<{ error?: Error }>((resolve) => {
      mocks.layers[0].createTile({ z: 7, x: 0, y: 0 }, (e) => resolve({ error: e }))
    })

    expect(error).toBeInstanceOf(TileRequestError)
  })

  it('resets authRequired after a successful tile load', async () => {
    mocks.cache.getTile.mockRejectedValueOnce(new mocks.MapTilesAuthError()).mockResolvedValueOnce(new Blob(['x']))
    const { authRequired } = await mount()
    await tileDone()
    expect(authRequired.value).toBe(true)

    const { error } = await tileDone()

    expect(error).toBeUndefined()
    expect(authRequired.value).toBe(false)
  })

  it('renders pin names through textContent, never as HTML', async () => {
    const { setPins } = await mount()
    const name = '<img src=x onerror=alert(1)>'

    setPins([{ id: '1', name, lat: 0, lng: 0, color: 'red', selected: false }])

    const label = mocks.markers[0].bindTooltip.mock.calls[0][0] as FakeElement
    expect(typeof label).toBe('object')
    expect(label.textContent).toBe(name)
  })

  it('adds a pulse marker on the selected pin and removes it on deselect', async () => {
    const { setPins } = await mount()
    const pin = { id: '1', name: 'A', lat: 1, lng: 2, color: 'red', selected: true }

    setPins([pin])
    expect(mocks.selections).toHaveLength(1)
    expect(mocks.selections[0].latlng).toEqual([1, 2])

    setPins([{ ...pin, selected: false }])
    expect(mocks.selections[0].remove).toHaveBeenCalled()
    expect(mocks.selections).toHaveLength(1)
  })

  it('pulses the selected city only while cities are visible', async () => {
    const { setCities, setSelectedCity, setCitiesVisible } = await mount()

    setCities([{ id: 7, name: 'Altdorf', lat: 3, lng: 4, type: 'Cité', population: 1, region: 'Reikland', country: null, subregion: null, url: null, pending: false, hidden: false, source: null }])
    setSelectedCity(7)
    expect(mocks.selections.at(-1)?.latlng).toEqual([3, 4])

    const count = mocks.selections.length
    setCitiesVisible(false)
    expect(mocks.selections).toHaveLength(count)
    expect(mocks.selections[count - 1].remove).toHaveBeenCalled()
  })
})
