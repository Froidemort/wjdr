<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="dark">
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>{{ character?.name ?? 'Personnage' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button data-testid="open-editor-button" @click="goToEditor">Editer</ion-button>
          <ion-button data-testid="export-json-button" @click="exportJson">Exporter</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-grid v-if="character">
        <ion-row>
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Points de blessures</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <h2 data-testid="wounds-value">{{ character.wounds.current }} / {{ character.wounds.max }}</h2>
                <ion-button data-testid="wounds-minus" @click="adjustWounds(-1)">-1</ion-button>
                <ion-button data-testid="wounds-plus" @click="adjustWounds(1)">+1</ion-button>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Points de fortune</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <h2 data-testid="fortune-value">{{ character.fortune }}</h2>
                <ion-button data-testid="fortune-minus" @click="adjustFortune(-1)">-1</ion-button>
                <ion-button data-testid="fortune-plus" @click="adjustFortune(1)">+1</ion-button>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Points de destin</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <h2 data-testid="fate-value">{{ character.fate }}</h2>
                <ion-button data-testid="fate-minus" @click="adjustFate(-1)">-1</ion-button>
                <ion-button data-testid="fate-plus" @click="adjustFate(1)">+1</ion-button>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Argent</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <span data-testid="money-value">{{ character.money.co }} co / {{ character.money.pa }} pa / {{ character.money.s }} s</span>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Inventaire et equipement</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list v-if="character.inventory.length > 0" lines="none">
                  <ion-item v-for="item in character.inventory" :key="item.id">
                    <ion-label>
                      <h3>{{ item.name }}</h3>
                      <p>Quantite: {{ item.quantity }} | Poids: {{ item.weight }}</p>
                    </ion-label>
                    <ion-badge v-if="item.equipped" color="success">Equipe</ion-badge>
                  </ion-item>
                </ion-list>
                <p v-else data-testid="inventory-empty">Aucun objet.</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-card v-else>
        <ion-card-content>Personnage introuvable.</ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter
} from '@ionic/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toCharacterExportJson, type Character } from '../../domain/character'
import { getCharacterById, patchCharacterResources } from '../../repositories/characterRepository'

const route = useRoute()
const router = useRouter()

const character = ref<Character>()

const characterId = computed(() => String(route.params.id ?? ''))

const loadCharacter = async (): Promise<void> => {
  character.value = await getCharacterById(characterId.value)
}

onIonViewWillEnter(() => {
  void loadCharacter()
})

const adjustWounds = async (delta: number): Promise<void> => {
  if (!character.value) {
    return
  }

  const next = await patchCharacterResources(character.value.id, {
    woundsCurrent: character.value.wounds.current + delta
  })
  character.value = next
}

const adjustFortune = async (delta: number): Promise<void> => {
  if (!character.value) {
    return
  }

  const next = await patchCharacterResources(character.value.id, {
    fortune: character.value.fortune + delta
  })
  character.value = next
}

const adjustFate = async (delta: number): Promise<void> => {
  if (!character.value) {
    return
  }

  const next = await patchCharacterResources(character.value.id, {
    fate: character.value.fate + delta
  })
  character.value = next
}

const goToEditor = (): void => {
  void router.push(`/character/${characterId.value}/edit`)
}

const exportJson = (): void => {
  if (!character.value) {
    return
  }

  const json = toCharacterExportJson(character.value)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `character-${character.value.id}.json`
  link.click()
  URL.revokeObjectURL(url)
}
</script>
