import { useResizeObserver } from '@vueuse/core'
import type * as Leaflet from 'leaflet'
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch, type Ref } from 'vue'
import {
  MAP_BOUNDS,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_OVERSCALE_LEVELS,
  MAP_TILE_SIZE,
} from '../config/map'
import { MapTilesAuthError } from '../services/mapTilesRepository'
import { useAuthStore } from '../stores/auth'
import type { City } from '../types/cities'
import { visibleCities } from '../utils/mapCities'
import { requestPersistentStorage, TileRequestError, type TileCache } from '../utils/mapTileCache'
import { overscaleAncestorTile } from '../utils/mapTileOverscale'
import { loadMapTileAvailability, useMapTileCache } from './useMapTileCache'

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
  onCitySelect?: (id: number) => void
}

const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/

/** Thin wrapper around Leaflet: lazy-loaded, no reactive Leaflet objects. */
export function useLeafletMap(container: Ref<HTMLElement | null>, handlers: LeafletMapHandlers) {
  const ready = ref(false)
  const error = ref<string | null>(null)
  /** Tiles are private: true when no session is available to load them. */
  const authRequired = ref(false)
  const map = shallowRef<Leaflet.Map | null>(null)
  const { isAuthenticated, initialized } = storeToRefs(useAuthStore())

  let L: typeof Leaflet | null = null
  let pinLayer: Leaflet.LayerGroup | null = null
  let renderer: Leaflet.Canvas | null = null
  let cityLayer: Leaflet.LayerGroup | null = null
  let tileLayer: Leaflet.TileLayer | null = null
  let tileCache: TileCache | null = null
  let pins: MapPin[] = []
  let cities: City[] = []
  let citiesVisible = true
  let selectedCityId: number | null = null
  let selectionMarker: Leaflet.Marker | null = null

  function createCachedTileLayer(leaflet: typeof Leaflet, cache: TileCache): Leaflet.TileLayer {
    class CachedTileLayer extends leaflet.TileLayer {
      protected override createTile(coords: Leaflet.Coords, done: Leaflet.DoneCallback): HTMLElement {
        const tile = document.createElement('img')
        tile.alt = ''
        tile.setAttribute('role', 'presentation')

        const show = (blob: Blob): void => {
          const objectUrl = URL.createObjectURL(blob)
          tile.onload = () => {
            URL.revokeObjectURL(objectUrl)
            authRequired.value = false
            done(undefined, tile)
          }
          tile.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            done(new Error('Tile decode failed.'), tile)
          }
          tile.src = objectUrl
        }
        const fail = (tileError: unknown): void => {
          if (tileError instanceof MapTilesAuthError) {
            authRequired.value = true
          }
          done(tileError instanceof Error ? tileError : new Error('Tile unavailable.'), tile)
        }

        const target = { z: coords.z, x: coords.x, y: coords.y }
        cache
          .getTile(target)
          .then(show)
          .catch(async (tileError: unknown) => {
            // Missing tiles (sparse top zoom) are drawn from a coarser ancestor instead of leaving a hole.
            if (tileError instanceof TileRequestError) {
              const stand = await overscaleAncestorTile(cache, target, MAP_TILE_SIZE, MAP_MIN_ZOOM, MAP_OVERSCALE_LEVELS).catch(() => null)
              if (stand) return show(stand)
            }
            fail(tileError)
          })

        return tile
      }
    }

    // Tiles are addressed by coords in createTile; the template is unused.
    return new CachedTileLayer('{z}/{x}/{y}', {
      tileSize: MAP_TILE_SIZE,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      maxNativeZoom: MAP_MAX_ZOOM,
      noWrap: true,
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

  function renderCities(): void {
    if (!L || !cityLayer || !renderer || !map.value) return

    cityLayer.clearLayers()
    if (!citiesVisible) return

    for (const city of visibleCities(cities, map.value.getZoom())) {
      const marker = L.circleMarker([city.lat, city.lng], {
        renderer,
        radius: city.population !== null && city.population >= 10000 ? 6 : 4,
        color: '#ffffff',
        weight: 1,
        fillColor: '#b45309',
        fillOpacity: 0.85,
        bubblingMouseEvents: false,
      })
      const label = document.createElement('span')
      label.textContent = city.name
      marker.bindTooltip(label, { direction: 'top', offset: [0, -4] })
      marker.on('click', () => handlers.onCitySelect?.(city.id))
      marker.addTo(cityLayer)
    }

    // Canvas draws in insertion order: re-add pins so they stay above cities.
    renderPins()
  }

  function setCities(next: City[]): void {
    cities = next
    renderCities()
    renderSelection()
  }

  function setCitiesVisible(visible: boolean): void {
    citiesVisible = visible
    renderCities()
    renderSelection()
  }

  function syncTileLayer(): void {
    if (!L || !map.value || !tileCache) return

    if (isAuthenticated.value) {
      authRequired.value = false
      if (!tileLayer) {
        tileLayer = createCachedTileLayer(L, tileCache)
        tileLayer.addTo(map.value)
        tileLayer.bringToBack()
      }
    } else {
      tileLayer?.remove()
      tileLayer = null
      authRequired.value = initialized.value
    }
  }

  function setPins(next: MapPin[]): void {
    pins = next
    renderPins()
    renderSelection()
  }

  function setSelectedCity(id: number | null): void {
    selectedCityId = id
    renderSelection()
  }

  /** CSS-animated DOM ring: the pulse stays off the canvas, so it never forces a redraw of every marker. */
  function renderSelection(): void {
    selectionMarker?.remove()
    selectionMarker = null
    if (!L || !map.value) return

    const pin = pins.find((candidate) => candidate.selected)
    const city = !pin && citiesVisible && selectedCityId !== null ? cities.find((candidate) => candidate.id === selectedCityId) : undefined
    const target = pin ?? city
    if (!target) return

    selectionMarker = L.marker([target.lat, target.lng], {
      icon: L.divIcon({
        className: 'map-selection-pulse',
        html: '<span class="map-selection-pulse__ring"></span>',
        iconSize: [44, 44],
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: -1000,
    }).addTo(map.value)
  }

  function flyTo(lat: number, lng: number, zoom?: number): void {
    map.value?.flyTo([lat, lng], Math.min(MAP_MAX_ZOOM, Math.max(zoom ?? map.value.getZoom(), MAP_MIN_ZOOM)), { duration: 0.5 })
  }

  function invalidateSize(): void {
    map.value?.invalidateSize()
  }

  onMounted(async () => {
    try {
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (!container.value) return
      L = leaflet

      tileCache = useMapTileCache()
      void tileCache.purgeOldVersions()
      void requestPersistentStorage()
      await loadMapTileAvailability()
      if (!container.value) return

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

      renderer = leaflet.canvas({ padding: 0.5 })
      cityLayer = leaflet.layerGroup().addTo(instance)
      pinLayer = leaflet.layerGroup().addTo(instance)
      instance.on('contextmenu', (event: Leaflet.LeafletMouseEvent) => {
        handlers.onContextMenu(event.latlng.lat, event.latlng.lng)
      })
      instance.on('zoomend', renderCities)

      map.value = instance
      syncTileLayer()
      ready.value = true
      renderCities()
      renderPins()
    } catch {
      error.value = 'Impossible de charger la carte.'
    }
  })

  watch([isAuthenticated, initialized], syncTileLayer)

  // Leaflet only listens to window resize; the container also changes with layout (dock, navbar, orientation).
  useResizeObserver(container, invalidateSize)

  onBeforeUnmount(() => {
    map.value?.remove()
    map.value = null
    selectionMarker = null
    pinLayer = null
    cityLayer = null
    tileLayer = null
    renderer = null
    ready.value = false
  })

  return { ready, error, authRequired, map, setPins, setCities, setCitiesVisible, setSelectedCity, flyTo, invalidateSize }
}
