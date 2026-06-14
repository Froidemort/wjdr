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
                <ion-card-title>Expérience</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-grid class="characteristics-grid">
                  <ion-row>
                    <ion-col size="12" size-md="4">
                      <div class="characteristic-item">
                        <span class="label">Disponible</span>
                        <span data-testid="experience-available-value" class="value">{{ character.experience.available }}</span>
                      </div>
                    </ion-col>
                    <ion-col size="12" size-md="4">
                      <div class="characteristic-item">
                        <span class="label">Dépensé</span>
                        <span data-testid="experience-spent-value" class="value">{{ character.experience.spent }}</span>
                      </div>
                    </ion-col>
                    <ion-col size="12" size-md="4">
                      <div class="characteristic-item">
                        <span class="label">Total</span>
                        <span data-testid="experience-total-value" class="value">{{ character.experience.total }}</span>
                      </div>
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Équipement</ion-card-title>
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

          <!-- Caractéristiques Principales -->
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Caractéristiques Principales</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-grid class="characteristics-grid">
                  <ion-row>
                    <!-- CC -->
                    <ion-col size="6" size-md="3">
                      <div class="characteristic-item">
                        <span class="label">CC</span>
                        <span data-testid="character-cc-value" class="value">{{ getCharacteristicTotal('cc') }}%</span>
                      </div>
                    </ion-col>
                    <!-- CT -->
                    <ion-col size="6" size-md="3">
                      <div class="characteristic-item">
                        <span class="label">CT</span>
                        <span data-testid="character-ct-value" class="value">{{ getCharacteristicTotal('ct') }}%</span>
                      </div>
                    </ion-col>
                    <!-- F -->
                    <ion-col size="6" size-md="3">
                      <div class="characteristic-item">
                        <span class="label">F</span>
                        <span data-testid="character-f-value" class="value">{{ getCharacteristicTotal('f') }}%</span>
                      </div>
                    </ion-col>
                    <!-- E -->
                    <ion-col size="6" size-md="3">
                      <div class="characteristic-item">
                        <span class="label">E</span>
                        <span data-testid="character-e-value" class="value">{{ getCharacteristicTotal('e') }}%</span>
                      </div>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <!-- Ag -->
                    <ion-col size="6" size-md="3">
                      <div class="characteristic-item">
                        <span class="label">Ag</span>
                        <span data-testid="character-ag-value" class="value">{{ getCharacteristicTotal('ag') }}%</span>
                      </div>
                    </ion-col>
                    <!-- Int -->
                    <ion-col size="6" size-md="3">
                      <div class="characteristic-item">
                        <span class="label">Int</span>
                        <span data-testid="character-int-value" class="value">{{ getCharacteristicTotal('int') }}%</span>
                      </div>
                    </ion-col>
                    <!-- FM -->
                    <ion-col size="6" size-md="3">
                      <div class="characteristic-item">
                        <span class="label">FM</span>
                        <span data-testid="character-fm-value" class="value">{{ getCharacteristicTotal('fm') }}%</span>
                      </div>
                    </ion-col>
                    <!-- Soc -->
                    <ion-col size="6" size-md="3">
                      <div class="characteristic-item">
                        <span class="label">Soc</span>
                        <span data-testid="character-soc-value" class="value">{{ getCharacteristicTotal('soc') }}%</span>
                      </div>
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <!-- Caractéristiques Secondaires -->
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Caractéristiques Secondaires</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-grid class="characteristics-grid">
                  <ion-row>
                    <!-- A -->
                    <ion-col size="6" size-md="4">
                      <div class="characteristic-item">
                        <span class="label">Attaques (A)</span>
                        <span class="value">{{ character.actions }}</span>
                      </div>
                    </ion-col>
                    <!-- M -->
                    <ion-col size="6" size-md="4">
                      <div class="characteristic-item">
                        <span class="label">Mouvement (M)</span>
                        <span class="value">{{ character.movement }}</span>
                      </div>
                    </ion-col>
                    <!-- BF -->
                    <ion-col size="6" size-md="4">
                      <div class="characteristic-item">
                        <span class="label">Bonus Force (BF)</span>
                        <span class="value">{{ getBonusForce() }}</span>
                      </div>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <!-- BE -->
                    <ion-col size="6" size-md="4">
                      <div class="characteristic-item">
                        <span class="label">Bonus Endurance (BE)</span>
                        <span class="value">{{ getBonusEndurance() }}</span>
                      </div>
                    </ion-col>
                    <!-- Mag -->
                    <ion-col size="6" size-md="4">
                      <div class="characteristic-item">
                        <span class="label">Magie (Mag)</span>
                        <span class="value">{{ character.magic }}</span>
                      </div>
                    </ion-col>
                    <!-- PF -->
                    <ion-col size="6" size-md="4">
                      <div class="characteristic-item">
                        <span class="label">Folie (PF)</span>
                        <span class="value">{{ character.insanity }}</span>
                      </div>
                    </ion-col>
                  </ion-row>
                </ion-grid>
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
import {
  toCharacterExportJson,
  type Character,
  type CharacteristicKey,
  getCharacteristicTotal as domainGetCharacteristicTotal,
  getBonusForce as domainGetBonusForce,
  getBonusEndurance as domainGetBonusEndurance
} from '../../domain/character'
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

const getCharacteristicTotalValue = (key: CharacteristicKey): number => {
  if (!character.value) {
    return 0
  }

  return domainGetCharacteristicTotal(character.value, key)
}

const getBonusForce = (): number => {
  if (!character.value) {
    return 0
  }

  return domainGetBonusForce(character.value)
}

const getBonusEndurance = (): number => {
  if (!character.value) {
    return 0
  }

  return domainGetBonusEndurance(character.value)
}

// Alias for template convenience
const getCharacteristicTotal = getCharacteristicTotalValue
</script>

<style scoped>
.characteristics-grid {
  padding: 0;
}

.characteristic-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  border-right: 1px solid var(--ion-border-color);
  border-bottom: 1px solid var(--ion-border-color);
}

.characteristic-item:nth-child(2n) {
  border-right: 0;
}

@media (max-width: 575px) {
  .characteristic-item {
    padding: 0.75rem 0.25rem;
  }
}

@media (min-width: 768px) {
  .characteristic-item:nth-child(4n) {
    border-right: 0;
  }

  .characteristic-item:nth-child(2n) {
    border-right: 1px solid var(--ion-border-color);
  }
}

.characteristic-item .label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ion-text-color-step-150);
  text-align: center;
}

.characteristic-item .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--ion-color-primary);
}
</style>
