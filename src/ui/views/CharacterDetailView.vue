<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="dark">
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>
          <span class="title-with-race">
            <span data-testid="character-race-icon">{{ raceIcon }}</span>
            <span>{{ character?.name ?? 'Personnage' }}</span>
          </span>
        </ion-title>
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
                <ion-card-title>Race</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <span data-testid="character-race-value">{{ raceIcon }} {{ raceLabel }}</span>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12">
            <resource-tracker-card
              title="Points de blessures"
              test-id-prefix="wounds"
              :current="character.wounds.current"
              :max="character.wounds.max"
              @adjust-current="adjustWounds"
              @save="saveWounds"
            />
          </ion-col>

          <ion-col size="12" size-md="6">
            <resource-tracker-card
              title="Points de fortune"
              test-id-prefix="fortune"
              :current="character.fortune.current"
              :max="character.fortune.max"
              @adjust-current="adjustFortune"
              @save="saveFortune"
            />
          </ion-col>

          <ion-col size="12" size-md="6">
            <resource-tracker-card
              title="Points de destin"
              test-id-prefix="fate"
              :current="character.fate.current"
              :max="character.fate.max"
              @adjust-current="adjustFate"
              @save="saveFate"
            />
          </ion-col>

          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Argent</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <span data-testid="money-value">{{ character.money.co }} co / {{ character.money.pa }} pa / {{ character.money.s }} s</span>
                <ion-grid class="money-edit-grid">
                  <ion-row>
                    <ion-col size="12" size-md="4">
                      <ion-item>
                        <ion-input
                          data-testid="money-edit-co-input"
                          v-model.number="moneyCoDraft"
                          type="number"
                          label="Couronnes d'or (co)"
                          label-placement="stacked"
                        />
                      </ion-item>
                    </ion-col>
                    <ion-col size="12" size-md="4">
                      <ion-item>
                        <ion-input
                          data-testid="money-edit-pa-input"
                          v-model.number="moneyPaDraft"
                          type="number"
                          label="Pistoles d'argent (pa)"
                          label-placement="stacked"
                        />
                      </ion-item>
                    </ion-col>
                    <ion-col size="12" size-md="4">
                      <ion-item>
                        <ion-input
                          data-testid="money-edit-s-input"
                          v-model.number="moneySDraft"
                          type="number"
                          label="Sous de cuivre (s)"
                          label-placement="stacked"
                        />
                      </ion-item>
                    </ion-col>
                  </ion-row>
                </ion-grid>
                <ion-button data-testid="money-save-button" expand="block" fill="outline" @click="saveMoney">
                  Sauvegarder l'argent
                </ion-button>
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
                <ion-card-title>Carrières</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>
                  <strong>Actuelle:</strong>
                  <span data-testid="character-current-career-value">{{ character.careers.current ?? 'Aucune' }}</span>
                </p>
                <div v-if="character.careers.previous.length > 0">
                  <p><strong>Anciennes:</strong></p>
                  <ion-list lines="none">
                    <ion-item
                      v-for="(career, index) in character.careers.previous"
                      :key="`career-${career}-${index}`"
                      :data-testid="`character-previous-career-${index}`"
                    >
                      <ion-label>{{ career }}</ion-label>
                    </ion-item>
                  </ion-list>
                </div>
                <p v-else data-testid="character-previous-careers-empty">Aucune ancienne carrière.</p>
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
                        <span data-testid="character-actions-value" class="value">{{ getActionsTotal() }}</span>
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
                        <span data-testid="character-bf-value" class="value">{{ getBonusForce() }}</span>
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
                        <span data-testid="character-magic-value" class="value">{{ getMagicTotal() }}</span>
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

          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Compétences</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list v-if="character.skills.length > 0" lines="none">
                  <ion-item
                    v-for="(skill, index) in character.skills"
                    :key="skill.id"
                    :data-testid="`character-skill-${index}`"
                  >
                    <ion-label>{{ getSkillLabel(skill) }}</ion-label>
                  </ion-item>
                </ion-list>
                <p v-else data-testid="character-skills-empty">Aucune compétence.</p>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Talents</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list v-if="character.talents.length > 0" lines="none">
                  <ion-item
                    v-for="(talent, index) in character.talents"
                    :key="talent.id"
                    :data-testid="`character-talent-${index}`"
                  >
                    <ion-label>{{ getTalentLabel(talent) }}</ion-label>
                  </ion-item>
                </ion-list>
                <p v-else data-testid="character-talents-empty">Aucun talent.</p>
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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter
} from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  formatSkillLabel,
  formatTalentLabel,
  getRaceIcon,
  getRaceLabel,
  getActionsTotal as domainGetActionsTotal,
  getMagicTotal as domainGetMagicTotal,
  toCharacterExportJson,
  type Character,
  type CharacterSkill,
  type CharacterTalent,
  type CharacteristicKey,
  getCharacteristicTotal as domainGetCharacteristicTotal,
  getBonusForce as domainGetBonusForce,
  getBonusEndurance as domainGetBonusEndurance
} from '../../domain/character'
import {
  getCharacterById,
  patchCharacterMoney,
  patchCharacterResources
} from '../../repositories/characterRepository'
import ResourceTrackerCard from '../components/ResourceTrackerCard.vue'

const route = useRoute()
const router = useRouter()

const character = ref<Character>()
const moneyCoDraft = ref(0)
const moneyPaDraft = ref(0)
const moneySDraft = ref(0)

const characterId = computed(() => String(route.params.id ?? ''))

const raceLabel = computed(() => {
  if (!character.value) {
    return ''
  }

  return getRaceLabel(character.value.race)
})

const raceIcon = computed(() => {
  if (!character.value) {
    return '🛡️'
  }

  return getRaceIcon(character.value.race)
})

const loadCharacter = async (): Promise<void> => {
  character.value = await getCharacterById(characterId.value)
}

watch(character, (nextCharacter) => {
  if (!nextCharacter) {
    return
  }

  moneyCoDraft.value = nextCharacter.money.co
  moneyPaDraft.value = nextCharacter.money.pa
  moneySDraft.value = nextCharacter.money.s
})

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

const saveWounds = async (payload: { current: number; max: number }): Promise<void> => {
  if (!character.value) {
    return
  }

  const next = await patchCharacterResources(character.value.id, {
    woundsCurrent: payload.current,
    woundsMax: payload.max
  })
  character.value = next
}

const adjustFortune = async (delta: number): Promise<void> => {
  if (!character.value) {
    return
  }

  const next = await patchCharacterResources(character.value.id, {
    fortuneCurrent: character.value.fortune.current + delta
  })
  character.value = next
}

const saveFortune = async (payload: { current: number; max: number }): Promise<void> => {
  if (!character.value) {
    return
  }

  const next = await patchCharacterResources(character.value.id, {
    fortuneCurrent: payload.current,
    fortuneMax: payload.max
  })
  character.value = next
}

const adjustFate = async (delta: number): Promise<void> => {
  if (!character.value) {
    return
  }

  const next = await patchCharacterResources(character.value.id, {
    fateCurrent: character.value.fate.current + delta
  })
  character.value = next
}

const saveFate = async (payload: { current: number; max: number }): Promise<void> => {
  if (!character.value) {
    return
  }

  const next = await patchCharacterResources(character.value.id, {
    fateCurrent: payload.current,
    fateMax: payload.max
  })
  character.value = next
}

const saveMoney = async (): Promise<void> => {
  if (!character.value) {
    return
  }

  const next = await patchCharacterMoney(character.value.id, {
    co: moneyCoDraft.value,
    pa: moneyPaDraft.value,
    s: moneySDraft.value
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

const getActionsTotal = (): number => {
  if (!character.value) {
    return 0
  }

  return domainGetActionsTotal(character.value)
}

const getMagicTotal = (): number => {
  if (!character.value) {
    return 0
  }

  return domainGetMagicTotal(character.value)
}

const getSkillLabel = (skill: CharacterSkill): string => formatSkillLabel(skill)

const getTalentLabel = (talent: CharacterTalent): string => formatTalentLabel(talent)

// Alias for template convenience
const getCharacteristicTotal = getCharacteristicTotalValue
</script>

<style scoped>
.characteristics-grid {
  padding: 0;
}

.money-edit-grid {
  padding: 0;
  margin-top: 0.5rem;
}

.title-with-race {
  align-items: center;
  display: inline-flex;
  gap: 0.5rem;
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
