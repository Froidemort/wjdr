<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>{{ title }}</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <h2 :data-testid="`${testIdPrefix}-value`">{{ currentValue }} / {{ maxValue }}</h2>
      <ion-button :data-testid="`${testIdPrefix}-minus`" @click="emit('adjustCurrent', -1)">-1</ion-button>
      <ion-button :data-testid="`${testIdPrefix}-plus`" @click="emit('adjustCurrent', 1)">+1</ion-button>

      <ion-grid class="resource-edit-grid">
        <ion-row>
          <ion-col size="12" size-md="6">
            <ion-item>
              <ion-input
                :data-testid="`${testIdPrefix}-current-input`"
                :value="draftCurrent"
                type="number"
                label="Actuel"
                label-placement="stacked"
                @ionInput="onCurrentInput"
              />
            </ion-item>
          </ion-col>
          <ion-col size="12" size-md="6">
            <ion-item>
              <ion-input
                :data-testid="`${testIdPrefix}-max-input`"
                :value="draftMax"
                type="number"
                label="Maximum"
                label-placement="stacked"
                @ionInput="onMaxInput"
              />
            </ion-item>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-button :data-testid="`${testIdPrefix}-save`" expand="block" fill="outline" @click="saveDraft">
        Sauvegarder
      </ion-button>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonInput,
  IonItem,
  IonRow
} from '@ionic/vue'
import { computed, ref, watch } from 'vue'

interface Props {
  title: string
  testIdPrefix: string
  current: number
  max: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  adjustCurrent: [delta: number]
  save: [payload: { current: number; max: number }]
}>()

const draftCurrent = ref(props.current)
const draftMax = ref(props.max)

watch(
  () => [props.current, props.max],
  ([nextCurrent, nextMax]) => {
    draftCurrent.value = nextCurrent
    draftMax.value = nextMax
  }
)

const currentValue = computed(() => props.current)
const maxValue = computed(() => props.max)

const parseNumeric = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

const onCurrentInput = (event: CustomEvent): void => {
  const next = parseNumeric(event.detail?.value, draftCurrent.value)
  draftCurrent.value = next
}

const onMaxInput = (event: CustomEvent): void => {
  const next = parseNumeric(event.detail?.value, draftMax.value)
  draftMax.value = next
}

const saveDraft = (): void => {
  emit('save', {
    current: draftCurrent.value,
    max: draftMax.value
  })
}
</script>

<style scoped>
.resource-edit-grid {
  padding: 0;
  margin-top: 0.5rem;
}
</style>
