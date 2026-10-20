import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { listCities } from '../services/citiesRepository'
import {
  createCampaignMarker,
  deleteCampaignMarker,
  listBaseMarkers,
  listCampaignMarkers,
  listMarkerTypes,
  updateCampaignMarker,
} from '../services/mapRepository'
import type { City } from '../types/cities'
import type { MapMarker, MarkerDraft, MarkerType } from '../types/map'
import { cityTypesOf, filterCitiesByType } from '../utils/mapCities'
import { filterMarkers, mergeMarkers } from '../utils/mapMarkers'
import { searchPlaces } from '../utils/mapSearch'

const LOAD_ERROR = 'Impossible de charger la carte. Réessaie dans un instant.'
const WRITE_ERROR = 'Le marqueur n\'a pas pu être enregistré. Vérifie ta connexion et tes droits.'

export const useMapStore = defineStore('map', () => {
  const types = ref<MarkerType[]>([])
  const baseMarkers = ref<MapMarker[]>([])
  const campaignMarkers = ref<MapMarker[]>([])
  const campaignId = ref<string | null>(null)
  const cities = ref<City[]>([])

  const showCampaign = useStorage('wjdr:map:show-campaign', true)
  const showCities = useStorage('wjdr:map:show-cities', true)
  const hiddenTypeIds = useStorage<string[]>('wjdr:map:hidden-types', [])
  const hiddenCityTypes = useStorage<string[]>('wjdr:map:hidden-city-types', [])
  const query = ref('')
  const selectedId = ref<string | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)
  const writeError = ref<string | null>(null)

  const allMarkers = computed(() => mergeMarkers(baseMarkers.value, campaignMarkers.value))
  const visibleMarkers = computed(() =>
    filterMarkers(allMarkers.value, {
      showCampaign: showCampaign.value,
      showPois: showCities.value,
      hiddenTypeIds: hiddenTypeIds.value,
    })
  )
  const cityTypes = computed(() => cityTypesOf(cities.value))
  const shownCities = computed(() => (showCities.value ? filterCitiesByType(cities.value, hiddenCityTypes.value) : []))
  // Type filters only apply to the base layer, so list only the types it uses.
  const poiTypes = computed(() => {
    const used = new Set(baseMarkers.value.map((marker) => marker.typeId))
    return types.value.filter((type) => used.has(type.id))
  })
  const searchResults = computed(() => searchPlaces(visibleMarkers.value, cities.value, query.value))
  const selectedMarker = computed(() => allMarkers.value.find((marker) => marker.id === selectedId.value) ?? null)
  const typesById = computed(() => new Map(types.value.map((type) => [type.id, type])))

  let pendingBase: Promise<void> | null = null

  function loadBase(force = false): Promise<void> {
    if (!force && baseMarkers.value.length > 0 && types.value.length > 0) return Promise.resolve()
    if (pendingBase) return pendingBase

    loading.value = true
    error.value = null

    pendingBase = Promise.all([listMarkerTypes(), listBaseMarkers()])
      .then(([typeRows, markerRows]) => {
        types.value = typeRows
        baseMarkers.value = markerRows
      })
      .catch(() => {
        error.value = LOAD_ERROR
      })
      .finally(() => {
        loading.value = false
        pendingBase = null
      })

    return pendingBase
  }

  /** Lazy: fetched once, only when the cities layer is shown. */
  async function loadCities(): Promise<void> {
    if (cities.value.length > 0) return

    try {
      cities.value = await listCities()
    } catch {
      error.value = LOAD_ERROR
    }
  }

  /** Loads markers of a campaign, or clears them when `id` is null. */
  async function loadCampaign(id: string | null): Promise<void> {
    campaignId.value = id
    if (!id) {
      campaignMarkers.value = []
      return
    }

    try {
      const rows = await listCampaignMarkers(id)
      if (campaignId.value === id) {
        campaignMarkers.value = rows
      }
    } catch {
      error.value = LOAD_ERROR
    }
  }

  function toggleType(typeId: string): void {
    hiddenTypeIds.value = hiddenTypeIds.value.includes(typeId)
      ? hiddenTypeIds.value.filter((id) => id !== typeId)
      : [...hiddenTypeIds.value, typeId]
  }

  function toggleCityType(cityType: string): void {
    hiddenCityTypes.value = hiddenCityTypes.value.includes(cityType)
      ? hiddenCityTypes.value.filter((item) => item !== cityType)
      : [...hiddenCityTypes.value, cityType]
  }

  function select(id: string | null): void {
    selectedId.value = id
  }

  async function addMarker(draft: MarkerDraft, userId: string): Promise<MapMarker | null> {
    const targetCampaignId = campaignId.value
    if (!targetCampaignId) return null

    writeError.value = null
    const optimistic: MapMarker = {
      id: `pending-${crypto.randomUUID()}`,
      source: 'campaign',
      typeId: draft.typeId,
      name: draft.name,
      description: draft.description,
      lat: draft.lat,
      lng: draft.lng,
      campaignId: targetCampaignId,
      visibility: draft.visibility,
      createdBy: userId,
      createdAt: null,
      pending: true,
    }
    campaignMarkers.value = [...campaignMarkers.value, optimistic]

    try {
      const saved = await createCampaignMarker(targetCampaignId, draft)
      campaignMarkers.value = campaignMarkers.value.map((marker) => (marker.id === optimistic.id ? saved : marker))
      return saved
    } catch {
      campaignMarkers.value = campaignMarkers.value.filter((marker) => marker.id !== optimistic.id)
      writeError.value = WRITE_ERROR
      return null
    }
  }

  async function editMarker(id: string, draft: MarkerDraft): Promise<boolean> {
    const previous = campaignMarkers.value.find((marker) => marker.id === id)
    if (!previous) return false

    writeError.value = null
    campaignMarkers.value = campaignMarkers.value.map((marker) =>
      marker.id === id ? { ...marker, ...draft, pending: true } : marker
    )

    try {
      const saved = await updateCampaignMarker(id, draft)
      campaignMarkers.value = campaignMarkers.value.map((marker) => (marker.id === id ? saved : marker))
      return true
    } catch {
      campaignMarkers.value = campaignMarkers.value.map((marker) => (marker.id === id ? previous : marker))
      writeError.value = WRITE_ERROR
      return false
    }
  }

  async function removeMarker(id: string): Promise<boolean> {
    const previous = campaignMarkers.value
    const target = previous.find((marker) => marker.id === id)
    if (!target) return false

    writeError.value = null
    campaignMarkers.value = previous.filter((marker) => marker.id !== id)
    if (selectedId.value === id) selectedId.value = null

    try {
      await deleteCampaignMarker(id)
      return true
    } catch {
      campaignMarkers.value = previous
      writeError.value = WRITE_ERROR
      return false
    }
  }

  return {
    types,
    typesById,
    baseMarkers,
    campaignMarkers,
    campaignId,
    cities,
    showCampaign,
    showCities,
    hiddenTypeIds,
    hiddenCityTypes,
    cityTypes,
    shownCities,
    poiTypes,
    query,
    selectedId,
    selectedMarker,
    loading,
    error,
    writeError,
    allMarkers,
    visibleMarkers,
    searchResults,
    loadBase,
    loadCampaign,
    loadCities,
    toggleType,
    toggleCityType,
    select,
    addMarker,
    editMarker,
    removeMarker,
  }
})
