<script setup lang="ts">
import { Layers } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import CityDetailSheet from '../components/map/CityDetailSheet.vue'
import MapCanvas from '../components/map/MapCanvas.vue'
import MapLayerPanel from '../components/map/MapLayerPanel.vue'
import MapSearch from '../components/map/MapSearch.vue'
import MarkerDetailSheet from '../components/map/MarkerDetailSheet.vue'
import MarkerFormModal from '../components/map/MarkerFormModal.vue'
import { useMapCampaign } from '../composables/useMapCampaign'
import type { MapPin } from '../composables/useLeafletMap'
import { useMapTilePrefetch } from '../composables/useMapTilePrefetch'
import { useRealtimeSync } from '../composables/useRealtimeSync'
import { useMapStore } from '../stores/map'
import type { MapFlyTarget, MapMarker, MapSearchResult, MarkerDraft } from '../types/map'
import { allowedVisibilities, canEditMarker } from '../utils/mapMarkers'
import { normalizeLatLng } from '../utils/mapCoordinates'

const FALLBACK_COLOR = '#0369a1'
const FOCUS_ZOOM = 5

const store = useMapStore()
const {
  types,
  typesById,
  showCampaign,
  showCities,
  cities,
  shownCities,
  cityTypes,
  hiddenCityTypes,
  poiTypes,
  hiddenTypeIds,
  query,
  selectedId,
  selectedMarker,
  visibleMarkers,
  searchResults,
  loading,
  error,
  writeError,
} = storeToRefs(store)
const { campaignId, role, userId } = useMapCampaign()
const { state: prefetchState, start: startPrefetch, cancel: cancelPrefetch } = useMapTilePrefetch()
const selectedCityId = ref<number | null>(null)
const selectedCity = computed(() => cities.value.find((city) => city.id === selectedCityId.value) ?? null)

const flyTarget = ref<MapFlyTarget | null>(null)
const formOpen = ref(false)
const editing = ref<MapMarker | null>(null)
const newPosition = ref<{ lat: number; lng: number } | null>(null)
const saving = ref(false)
const hint = ref<string | null>(null)

const pins = computed<MapPin[]>(() =>
  visibleMarkers.value.map((marker) => ({
    id: marker.id,
    name: marker.name,
    lat: marker.lat,
    lng: marker.lng,
    color: typesById.value.get(marker.typeId)?.color ?? FALLBACK_COLOR,
    selected: marker.id === selectedId.value,
  }))
)
const visibilities = computed(() => allowedVisibilities(role.value))
const canEditSelected = computed(() => (selectedMarker.value ? canEditMarker(selectedMarker.value, userId.value, role.value) : false))

function selectMarker(id: string | null): void {
  if (id) selectedCityId.value = null
  store.select(id)
}

function selectCity(id: number): void {
  store.select(null)
  selectedCityId.value = id
}

function centerCity(): void {
  if (selectedCity.value) {
    flyTarget.value = { lat: selectedCity.value.lat, lng: selectedCity.value.lng, zoom: FOCUS_ZOOM, nonce: Date.now() }
  }
}

function focusMarker(marker: MapMarker): void {
  selectedCityId.value = null
  store.select(marker.id)
  flyTarget.value = { lat: marker.lat, lng: marker.lng, zoom: FOCUS_ZOOM, nonce: Date.now() }
}

function selectResult(result: MapSearchResult): void {
  if (result.kind === 'marker') {
    const marker = selectedMarkerById(result.id)
    if (marker) focusMarker(marker)
    return
  }

  const city = cities.value.find((item) => item.id === result.id)
  if (!city) return
  store.select(null)
  selectedCityId.value = city.id
  flyTarget.value = { lat: city.lat, lng: city.lng, zoom: FOCUS_ZOOM, nonce: Date.now() }
}

function selectedMarkerById(id: string): MapMarker | undefined {
  return store.allMarkers.find((marker) => marker.id === id)
}

function onMapContextMenu(lat: number, lng: number): void {
  if (!role.value) {
    hint.value = 'Connecte-toi et choisis une campagne pour ajouter des marqueurs.'
    return
  }

  hint.value = null
  editing.value = null
  newPosition.value = normalizeLatLng(lat, lng)
  formOpen.value = true
}

function startEdit(): void {
  editing.value = selectedMarker.value
  newPosition.value = null
  formOpen.value = true
}

async function onSubmit(draft: MarkerDraft): Promise<void> {
  if (!userId.value) return

  saving.value = true
  const target = editing.value
  const result = target ? await store.editMarker(target.id, draft) : await store.addMarker(draft, userId.value)
  saving.value = false

  if (result) {
    formOpen.value = false
  }
}

async function onRemove(): Promise<void> {
  if (selectedMarker.value) {
    await store.removeMarker(selectedMarker.value.id)
  }
}

const { start, stop } = useRealtimeSync({
  onUpdate: () => store.loadCampaign(campaignId.value),
})

watch(
  campaignId,
  (id) => {
    void store.loadCampaign(id)
    if (id) {
      start(`map-markers-${id}`, [{ table: 'campaign_markers', filter: `campaign_id=eq.${id}` }])
    } else {
      stop()
    }
  },
  { immediate: true }
)

onMounted(() => {
  void store.loadBase()
  // Cities are searchable even when their layer is hidden.
  void store.loadCities()
})
</script>

<template>
  <div id="map-page" class="h-[calc(100dvh-var(--grim-chrome-height,0px))] overflow-hidden">
    <div class="drawer lg:drawer-open size-full">
      <input id="map-layers-drawer" type="checkbox" class="drawer-toggle" aria-label="Afficher les calques" />

      <div class="drawer-content relative size-full">
        <MapCanvas
          :pins="pins"
          :cities="shownCities"
          :show-cities="showCities"
          :selected-city-id="selectedMarker ? null : selectedCityId"
          :fly-target="flyTarget"
          @select="selectMarker"
          @select-city="selectCity"
          @contextmenu="onMapContextMenu"
        />

        <div class="pointer-events-none absolute top-0 inset-s-14 right-0 z-20 flex items-start gap-2 p-3">
          <div class="pointer-events-auto w-full max-w-md">
            <MapSearch v-model="query" :results="searchResults" @select="selectResult" />
          </div>
          <label for="map-layers-drawer" class="btn btn-square min-h-11 min-w-11 pointer-events-auto lg:hidden" aria-label="Calques">
            <Layers class="size-5" aria-hidden="true" />
          </label>
        </div>

        <div class="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center gap-2 px-3">
          <p v-if="loading" class="badge badge-neutral pointer-events-auto">Chargement des lieux…</p>
          <p v-if="error" role="alert" class="alert alert-error alert-soft pointer-events-auto py-2 text-sm">{{ error }}</p>
          <p v-if="writeError" role="alert" class="alert alert-error alert-soft pointer-events-auto py-2 text-sm">{{ writeError }}</p>
          <p v-if="hint" role="status" class="alert alert-info alert-soft pointer-events-auto py-2 text-sm">{{ hint }}</p>
        </div>

        <CityDetailSheet v-if="selectedCity && !selectedMarker" :city="selectedCity" @close="selectedCityId = null" @center="centerCity" />

        <MarkerDetailSheet
          v-if="selectedMarker"
          :marker="selectedMarker"
          :type="typesById.get(selectedMarker.typeId) ?? null"
          :can-edit="canEditSelected"
          @close="store.select(null)"
          @center="focusMarker(selectedMarker)"
          @edit="startEdit"
          @remove="onRemove"
        />
      </div>

      <div class="drawer-side z-50">
        <label for="map-layers-drawer" class="drawer-overlay" aria-label="Fermer les calques" />
        <div class="min-h-full w-72 bg-base-100">
          <MapLayerPanel
            v-model:show-campaign="showCampaign"
            v-model:show-cities="showCities"
            :types="poiTypes"
            :hidden-type-ids="hiddenTypeIds"
            :city-types="cityTypes"
            :hidden-city-types="hiddenCityTypes"
            :has-campaign="campaignId !== null"
            :prefetch="prefetchState"
            @toggle-type="store.toggleType"
            @toggle-city-type="store.toggleCityType"
            @prefetch="startPrefetch"
            @cancel-prefetch="cancelPrefetch"
          />
        </div>
      </div>
    </div>

    <MarkerFormModal
      :open="formOpen"
      :types="types"
      :visibilities="visibilities"
      :marker="editing"
      :position="newPosition"
      :saving="saving"
      @submit="onSubmit"
      @close="formOpen = false"
    />
  </div>
</template>
