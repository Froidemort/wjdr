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
          <ion-select data-testid="edit-race-input" v-model="race" label="Race" label-placement="stacked">
            <ion-select-option
              v-for="option in raceOptions"
              :key="option.key"
              :value="option.key"
            >
              {{ option.label }}
            </ion-select-option>
          </ion-select>
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
          <ion-label>Carrières</ion-label>
        </ion-item>
        <ion-item>
          <ion-select
            data-testid="edit-current-career-input"
            v-model="currentCareer"
            label="Carrière actuelle"
            label-placement="stacked"
          >
            <ion-select-option :value="null">Aucune</ion-select-option>
            <ion-select-option
              v-for="careerName in careerCatalog"
              :key="careerName"
              :value="careerName"
            >
              {{ careerName }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select
            data-testid="edit-previous-career-input"
            v-model="selectedPreviousCareer"
            label="Ajouter une ancienne carrière"
            label-placement="stacked"
          >
            <ion-select-option
              v-for="careerName in availablePreviousCareers"
              :key="careerName"
              :value="careerName"
            >
              {{ careerName }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-button data-testid="add-previous-career-button" expand="block" fill="outline" @click="addPreviousCareer">
          Ajouter ancienne carrière
        </ion-button>
        <ion-item v-for="(careerName, index) in previousCareers" :key="`${careerName}-${index}`">
          <ion-label :data-testid="`edit-previous-career-${index}`">{{ careerName }}</ion-label>
          <ion-button
            :data-testid="`remove-previous-career-${index}`"
            size="small"
            color="danger"
            fill="clear"
            @click="removePreviousCareer(index)"
          >
            Supprimer
          </ion-button>
        </ion-item>

        <ion-item lines="none">
          <ion-label>Compétences</ion-label>
        </ion-item>
        <ion-item>
          <ion-select
            data-testid="edit-skill-input"
            v-model="selectedSkillId"
            label="Ajouter une compétence"
            label-placement="stacked"
          >
            <ion-select-option
              v-for="skill in availableSkills"
              :key="skill.id"
              :value="skill.id"
            >
              {{ formatNameWithSpecialization(skill.name, skill.specialization) }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-button data-testid="add-skill-button" expand="block" fill="outline" @click="addSkill">
          Ajouter compétence
        </ion-button>
        <ion-item v-for="(skill, index) in skills" :key="skill.id">
          <ion-label :data-testid="`edit-skill-${index}`">{{ formatSkillLabel(skill) }}</ion-label>
          <ion-button
            :data-testid="`remove-skill-${index}`"
            size="small"
            color="danger"
            fill="clear"
            @click="removeSkill(index)"
          >
            Supprimer
          </ion-button>
        </ion-item>

        <ion-item lines="none">
          <ion-label>Talents</ion-label>
        </ion-item>
        <ion-item>
          <ion-select
            data-testid="edit-talent-input"
            v-model="selectedTalentId"
            label="Ajouter un talent"
            label-placement="stacked"
          >
            <ion-select-option
              v-for="talent in availableTalents"
              :key="talent.id"
              :value="talent.id"
            >
              {{ formatNameWithSpecialization(talent.name, talent.specialization) }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-button data-testid="add-talent-button" expand="block" fill="outline" @click="addTalent">
          Ajouter talent
        </ion-button>
        <ion-item v-for="(talent, index) in talents" :key="talent.id">
          <ion-label :data-testid="`edit-talent-${index}`">{{ formatTalentLabel(talent) }}</ion-label>
          <ion-button
            :data-testid="`remove-talent-${index}`"
            size="small"
            color="danger"
            fill="clear"
            @click="removeTalent(index)"
          >
            Supprimer
          </ion-button>
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
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter
} from '@ionic/vue'
import { computed, reactive, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CAREER_CATALOG,
  RACE_OPTIONS,
  SKILL_CATALOG,
  TALENT_CATALOG,
  formatNameWithSpecialization,
  formatSkillLabel,
  formatTalentLabel,
  patchCareers,
  type Experience,
  type RaceKey,
  type CharacterSkill,
  type CharacterTalent,
  type CharacteristicKey,
  type Characteristics,
  normalizeExperience,
  patchInventory,
  patchMoney,
  patchResources,
  patchSkills,
  patchTalents,
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
const race = ref<RaceKey>('human')
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
const skills = ref<CharacterSkill[]>([])
const talents = ref<CharacterTalent[]>([])
const currentCareer = ref<string | null>(null)
const previousCareers = ref<string[]>([])
const selectedSkillId = ref<string>('')
const selectedTalentId = ref<string>('')
const selectedPreviousCareer = ref<string>('')
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

const raceOptions = RACE_OPTIONS
const careerCatalog = CAREER_CATALOG

const availableSkills = computed(() =>
  SKILL_CATALOG.filter((entry) => !skills.value.some((skill) => skill.skillId === entry.id))
)

const availableTalents = computed(() =>
  TALENT_CATALOG.filter((entry) => !talents.value.some((talent) => talent.talentId === entry.id))
)

const availablePreviousCareers = computed(() =>
  CAREER_CATALOG.filter(
    (careerName) =>
      careerName !== currentCareer.value && !previousCareers.value.includes(careerName)
  )
)

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
  race.value = current.race
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
  skills.value = structuredClone(current.skills)
  talents.value = structuredClone(current.talents)
  currentCareer.value = current.careers.current
  previousCareers.value = structuredClone(current.careers.previous)
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
  const withSkills = patchSkills(withInventory, skills.value)
  const withTalents = patchTalents(withSkills, talents.value)
  const withCareers = patchCareers(withTalents, {
    current: currentCareer.value,
    previous: previousCareers.value
  })
  const withCharacteristics = normalizeMainCharacteristics(mainCharacteristics)
  const withExperience = normalizeExperience(experience)

  const next: Character = {
    ...withCareers,
    race: race.value,
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

const addSkill = (): void => {
  if (!selectedSkillId.value) {
    return
  }

  const selected = SKILL_CATALOG.find((entry) => entry.id === selectedSkillId.value)
  if (!selected) {
    return
  }

  skills.value.push({
    id: crypto.randomUUID(),
    skillId: selected.id,
    specialization: selected.specialization
  })

  selectedSkillId.value = ''
}

const removeSkill = (index: number): void => {
  skills.value = skills.value.filter((_, i) => i !== index)
}

const addTalent = (): void => {
  if (!selectedTalentId.value) {
    return
  }

  const selected = TALENT_CATALOG.find((entry) => entry.id === selectedTalentId.value)
  if (!selected) {
    return
  }

  talents.value.push({
    id: crypto.randomUUID(),
    talentId: selected.id,
    specialization: selected.specialization
  })

  selectedTalentId.value = ''
}

const removeTalent = (index: number): void => {
  talents.value = talents.value.filter((_, i) => i !== index)
}

const addPreviousCareer = (): void => {
  if (!selectedPreviousCareer.value) {
    return
  }

  previousCareers.value.push(selectedPreviousCareer.value)
  selectedPreviousCareer.value = ''
}

const removePreviousCareer = (index: number): void => {
  previousCareers.value = previousCareers.value.filter((_, i) => i !== index)
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
