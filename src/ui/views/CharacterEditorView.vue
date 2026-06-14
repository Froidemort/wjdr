<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="medium">
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/character/${characterId}`" />
        </ion-buttons>
        <ion-title>Edition</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list inset v-if="formLoaded">
        <ion-item>
          <ion-input data-testid="edit-name-input" v-model="name" label="Nom" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-wounds-current-input" v-model.number="woundsCurrent" type="number" label="PV actuels" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-wounds-max-input" v-model.number="woundsMax" type="number" label="PV max" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-fortune-input" v-model.number="fortune" type="number" label="Fortune" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-fate-input" v-model.number="fate" type="number" label="Destin" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-money-co-input" v-model.number="moneyCo" type="number" label="Couronnes d'or (co)" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-money-pa-input" v-model.number="moneyPa" type="number" label="Pistoles d'argent (pa)" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-money-s-input" v-model.number="moneyS" type="number" label="Sous de cuivre (s)" label-placement="stacked" />
        </ion-item>

        <ion-item lines="none">
          <ion-label>Expérience</ion-label>
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-experience-available-input" v-model.number="experience.available" type="number" label="Disponible" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-experience-spent-input" v-model.number="experience.spent" type="number" label="Dépensé" label-placement="stacked" />
        </ion-item>

        <ion-item lines="none">
          <ion-label>Caractéristiques Principales</ion-label>
        </ion-item>
        <ion-grid class="main-characteristics-grid">
          <ion-row>
            <ion-col
              v-for="field in mainCharacteristicFields"
              :key="field.key"
              size="12"
              size-md="6"
            >
              <div class="main-characteristic-block">
                <h3>{{ field.label }}</h3>
                <ion-item>
                  <ion-input
                    :data-testid="`edit-${field.key}-base-input`"
                    v-model.number="mainCharacteristics[field.key].base"
                    type="number"
                    :label="`${field.label} base (%)`"
                    label-placement="stacked"
                  />
                </ion-item>
                <ion-item>
                  <ion-input
                    :data-testid="`edit-${field.key}-advance-input`"
                    v-model.number="mainCharacteristics[field.key].advance"
                    type="number"
                    :label="`${field.label} avance (%)`"
                    label-placement="stacked"
                  />
                </ion-item>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-item lines="none">
          <ion-label>Caractéristiques Secondaires</ion-label>
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-actions-input" v-model.number="actions" type="number" label="Attaques/Actions (A)" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-movement-input" v-model.number="movement" type="number" label="Mouvement (M)" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-magic-input" v-model.number="magic" type="number" label="Magie (Mag)" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-insanity-input" v-model.number="insanity" type="number" label="Points de Folie (PF)" label-placement="stacked" />
        </ion-item>

        <ion-item lines="none">
          <ion-label>Équipement</ion-label>
        </ion-item>
        <ion-item>
          <ion-input v-model="newItemName" label="Objet" label-placement="stacked" placeholder="Ex: Épée" />
        </ion-item>
        <ion-item>
          <ion-input v-model.number="newItemQuantity" type="number" label="Quantité" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input v-model.number="newItemWeight" type="number" label="Poids" label-placement="stacked" />
        </ion-item>
        <ion-button expand="block" fill="outline" @click="addInventoryItem">Ajouter objet</ion-button>

        <ion-item v-for="item in inventory" :key="item.id">
          <ion-label>
            <h3>{{ item.name }}</h3>
            <p>Quantité: {{ item.quantity }} | Poids: {{ item.weight }}</p>
          </ion-label>
          <ion-button size="small" fill="clear" @click="toggleEquipped(item.id)">
            {{ item.equipped ? 'Équipé' : 'Non équipé' }}
          </ion-button>
          <ion-button size="small" color="danger" fill="clear" @click="removeInventoryItem(item.id)">Supprimer</ion-button>
        </ion-item>

        <ion-button data-testid="save-editor-button" expand="block" class="ion-margin-top" @click="onSave">Sauvegarder</ion-button>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonCol,
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
import { computed, reactive, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  type Experience,
  type CharacteristicKey,
  type Characteristics,
  normalizeExperience,
  patchInventory,
  patchMoney,
  patchResources,
  renameCharacter,
  type Character,
  type InventoryItem
} from '../../domain/character'
import { getCharacterById, saveCharacter } from '../../repositories/characterRepository'

const route = useRoute()
const router = useRouter()

const characterId = computed(() => String(route.params.id ?? ''))

const character = ref<Character>()
const formLoaded = ref(false)

const name = ref('')
const woundsCurrent = ref(0)
const woundsMax = ref(0)
const fortune = ref(0)
const fate = ref(0)
const moneyCo = ref(0)
const moneyPa = ref(0)
const moneyS = ref(0)
const experience = reactive<Experience>({
  total: 0,
  spent: 0,
  available: 0
})
const actions = ref(1)
const movement = ref(4)
const magic = ref(0)
const insanity = ref(0)
const mainCharacteristics = reactive<Characteristics>({
  cc: { base: 30, advance: 0 },
  ct: { base: 30, advance: 0 },
  f: { base: 30, advance: 0 },
  e: { base: 30, advance: 0 },
  ag: { base: 30, advance: 0 },
  int: { base: 30, advance: 0 },
  fm: { base: 30, advance: 0 },
  soc: { base: 30, advance: 0 }
})
const mainCharacteristicFields: Array<{ key: CharacteristicKey; label: string }> = [
  { key: 'cc', label: 'CC' },
  { key: 'ct', label: 'CT' },
  { key: 'f', label: 'F' },
  { key: 'e', label: 'E' },
  { key: 'ag', label: 'Ag' },
  { key: 'int', label: 'Int' },
  { key: 'fm', label: 'FM' },
  { key: 'soc', label: 'Soc' }
]
const inventory = ref<InventoryItem[]>([])
const newItemName = ref('')
const newItemQuantity = ref(1)
const newItemWeight = ref(0)

const normalizeMainCharacteristics = (value: Characteristics): Characteristics => {
  return {
    cc: {
      base: Math.max(0, Math.trunc(value.cc.base)),
      advance: Math.max(0, Math.trunc(value.cc.advance))
    },
    ct: {
      base: Math.max(0, Math.trunc(value.ct.base)),
      advance: Math.max(0, Math.trunc(value.ct.advance))
    },
    f: {
      base: Math.max(0, Math.trunc(value.f.base)),
      advance: Math.max(0, Math.trunc(value.f.advance))
    },
    e: {
      base: Math.max(0, Math.trunc(value.e.base)),
      advance: Math.max(0, Math.trunc(value.e.advance))
    },
    ag: {
      base: Math.max(0, Math.trunc(value.ag.base)),
      advance: Math.max(0, Math.trunc(value.ag.advance))
    },
    int: {
      base: Math.max(0, Math.trunc(value.int.base)),
      advance: Math.max(0, Math.trunc(value.int.advance))
    },
    fm: {
      base: Math.max(0, Math.trunc(value.fm.base)),
      advance: Math.max(0, Math.trunc(value.fm.advance))
    },
    soc: {
      base: Math.max(0, Math.trunc(value.soc.base)),
      advance: Math.max(0, Math.trunc(value.soc.advance))
    }
  }
}

const fillForm = (current: Character): void => {
  name.value = current.name
  woundsCurrent.value = current.wounds.current
  woundsMax.value = current.wounds.max
  fortune.value = current.fortune
  fate.value = current.fate
  moneyCo.value = current.money.co
  moneyPa.value = current.money.pa
  moneyS.value = current.money.s
  Object.assign(experience, structuredClone(current.experience))
  Object.assign(mainCharacteristics, structuredClone(current.characteristics))
  actions.value = current.actions
  movement.value = current.movement
  magic.value = current.magic
  insanity.value = current.insanity
  inventory.value = structuredClone(current.inventory)
}

const loadCharacter = async (): Promise<void> => {
  const found = await getCharacterById(characterId.value)
  character.value = found
  if (found) {
    fillForm(found)
    formLoaded.value = true
  }
}

onIonViewWillEnter(() => {
  void loadCharacter()
})

const onSave = async (): Promise<void> => {
  if (!character.value) {
    return
  }

  // Dexie requires plain serializable objects, not Vue proxies.
  const plainCharacter = structuredClone(toRaw(character.value))

  const renamed = renameCharacter(plainCharacter, name.value)
  const patched = patchResources(renamed, {
    woundsCurrent: woundsCurrent.value,
    woundsMax: woundsMax.value,
    fortune: fortune.value,
    fate: fate.value
  })

  const withMoney = patchMoney(patched, {
    co: moneyCo.value,
    pa: moneyPa.value,
    s: moneyS.value
  })

  const withInventory = patchInventory(withMoney, inventory.value)
  const withCharacteristics = normalizeMainCharacteristics(mainCharacteristics)
  const withExperience = normalizeExperience(experience)

  const next: Character = {
    ...withInventory,
    experience: withExperience,
    characteristics: withCharacteristics,
    actions: Math.max(1, Math.trunc(actions.value)),
    movement: Math.max(1, Math.trunc(movement.value)),
    magic: Math.max(0, Math.trunc(magic.value)),
    insanity: Math.max(0, Math.trunc(insanity.value)),
    updatedAt: new Date().toISOString()
  }

  await saveCharacter(next)
  await router.push(`/character/${characterId.value}`)
}

const addInventoryItem = (): void => {
  const name = newItemName.value.trim()
  if (!name) {
    return
  }

  inventory.value.push({
    id: crypto.randomUUID(),
    name,
    quantity: Math.max(0, Math.trunc(newItemQuantity.value)),
    weight: Math.max(0, Math.trunc(newItemWeight.value)),
    equipped: false
  })

  newItemName.value = ''
  newItemQuantity.value = 1
  newItemWeight.value = 0
}

const removeInventoryItem = (id: string): void => {
  inventory.value = inventory.value.filter((item) => item.id !== id)
}

const toggleEquipped = (id: string): void => {
  inventory.value = inventory.value.map((item) =>
    item.id === id ? { ...item, equipped: !item.equipped } : item
  )
}
</script>

<style scoped>
.main-characteristics-grid {
  padding: 0 0.5rem 1rem;
}

.main-characteristic-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
}

.main-characteristic-block h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
</style>
