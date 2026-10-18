import type * as Leaflet from 'leaflet'
import { onBeforeUnmount, onMounted, ref, shallowRef, type Ref } from 'vue'
import {
  MAP_ATTRIBUTION,
  MAP_BOUNDS,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_TILE_CACHE_MAX_ENTRIES,
  MAP_TILE_CACHE_PREFIX,
  MAP_TILE_CACHE_VERSION,
  MAP_TILE_SIZE,
  getMapTilesUrl,
} from '../config/map'
import { createTileCache, type TileCache } from '../utils/mapTileCache'

export interface MapPin {
  id: string
  name: string
  lat: number
  lng: number
  color: string
  selected: boolean
}

export interface LeafletMapHandlers {
  onSelect: (id: string) => void
  /** Right click on desktop, long press on touch. */
  onContextMenu: (lat: number, lng: number) => void
}

const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/

/** Thin wrapper around Leaflet: lazy-loaded, no reactive Leaflet objects. */
export function useLeafletMap(container: Ref<HTMLElement | null>, handlers: LeafletMapHandlers) {
  const ready = ref(false)
  const error = ref<string | null>(null)
  const map = shallowRef<Leaflet.Map | null>(null)

  let L: typeof Leaflet | null = null
  let pinLayer: Leaflet.LayerGroup | null = null
  let renderer: Leaflet.Canvas | null = null
  let pins: MapPin[] = []

  function createCachedTileLayer(leaflet: typeof Leaflet, url: string, cache: TileCache): Leaflet.TileLayer {
    class CachedTileLayer extends leaflet.TileLayer {
      protected override createTile(coords: Leaflet.Coords, done: Leaflet.DoneCallback): HTMLElement {
        const tile = document.createElement('img')
        tile.alt = ''
        tile.setAttribute('role', 'presentation')

        cache
          .getTile(this.getTileUrl(coords))
          .then((blob) => {
            const objectUrl = URL.createObjectURL(blob)
            tile.onload = () => {
              URL.revokeObjectURL(objectUrl)
              done(undefined, tile)
            }
            tile.onerror = () => {
              URL.revokeObjectURL(objectUrl)
              done(new Error('Tile decode failed.'), tile)
            }
            tile.src = objectUrl
          })
          .catch((tileError: unknown) => {
            done(tileError instanceof Error ? tileError : new Error('Tile unavailable.'), tile)
          })

        return tile
      }
    }

    return new CachedTileLayer(url, {
      tileSize: MAP_TILE_SIZE,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      noWrap: true,
      attribution: MAP_ATTRIBUTION,
    })
  }

  function renderPins(): void {
    if (!L || !pinLayer || !renderer) return

    pinLayer.clearLayers()
    for (const pin of pins) {
      const color = SAFE_COLOR.test(pin.color) ? pin.color : '#0369a1'
      const marker = L.circleMarker([pin.lat, pin.lng], {
        renderer,
        radius: pin.selected ? 11 : 8,
        color: pin.selected ? '#ffffff' : '#1f2937',
        weight: pin.selected ? 3 : 1.5,
        fillColor: color,
        fillOpacity: 0.9,
        bubblingMouseEvents: false,
      })
      const label = document.createElement('span')
      label.textContent = pin.name
      marker.bindTooltip(label, { direction: 'top', offset: [0, -6] })
      marker.on('click', () => handlers.onSelect(pin.id))
      marker.addTo(pinLayer)
    }
  }

  function setPins(next: MapPin[]): void {
    pins = next
    renderPins()
  }

  function flyTo(lat: number, lng: number, zoom?: number): void {
    map.value?.flyTo([lat, lng], Math.min(MAP_MAX_ZOOM, Math.max(zoom ?? map.value.getZoom(), MAP_MIN_ZOOM)), { duration: 0.5 })
  }

  function invalidateSize(): void {
    map.value?.invalidateSize()
  }

  onMounted(async () => {
    const tilesUrl = getMapTilesUrl()
    if (!tilesUrl) {
      error.value = 'Les tuiles de la carte ne sont pas configurées (VITE_MAP_TILES_URL).'
      return
    }

    try {
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (!container.value) return
      L = leaflet

      const cache = createTileCache({
        cacheName: `${MAP_TILE_CACHE_PREFIX}-${MAP_TILE_CACHE_VERSION}`,
        prefix: MAP_TILE_CACHE_PREFIX,
        maxEntries: MAP_TILE_CACHE_MAX_ENTRIES,
      })
      void cache.purgeOldVersions().catch(() => undefined)

      const instance = leaflet.map(container.value, {
        crs: leaflet.CRS.EPSG3857,
        center: [...MAP_DEFAULT_CENTER],
        zoom: MAP_DEFAULT_ZOOM,
        minZoom: MAP_MIN_ZOOM,
        maxZoom: MAP_MAX_ZOOM,
        maxBounds: [
          [MAP_BOUNDS[0][0], MAP_BOUNDS[0][1]],
          [MAP_BOUNDS[1][0], MAP_BOUNDS[1][1]],
        ],
        maxBoundsViscosity: 1,
        worldCopyJump: false,
      })

      createCachedTileLayer(leaflet, tilesUrl, cache).addTo(instance)
      renderer = leaflet.canvas({ padding: 0.5 })
      pinLayer = leaflet.layerGroup().addTo(instance)
      instance.on('contextmenu', (event: Leaflet.LeafletMouseEvent) => {
        handlers.onContextMenu(event.latlng.lat, event.latlng.lng)
      })

      map.value = instance
      ready.value = true
      renderPins()
    } catch {
      error.value = 'Impossible de charger la carte.'
    }
  })

  onBeforeUnmount(() => {
    map.value?.remove()
    map.value = null
    pinLayer = null
    renderer = null
    ready.value = false
  })

  return { ready, error, map, setPins, flyTo, invalidateSize }
}
