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
        <ion-accordion-group value="identity" data-testid="edit-sections">
          <ion-accordion value="identity" data-testid="section-identity">
            <ion-item slot="header" color="light" data-testid="section-identity-header">
              <ion-label>Identité</ion-label>
            </ion-item>
            <div slot="content" class="section-content">
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
                <ion-input data-testid="edit-wounds-max-input" v-model.number="woundsMax" type="number" label="PV max" label-placement="stacked" />
              </ion-item>
            </div>
          </ion-accordion>

          <ion-accordion value="characteristics" data-testid="section-characteristics">
            <ion-item slot="header" color="light" data-testid="section-characteristics-header">
              <ion-label>Caractéristiques</ion-label>
            </ion-item>
            <div slot="content" class="section-content">
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
                      <ion-item>
                        <ion-input
                          :data-testid="`edit-${field.key}-ticks-input`"
                          v-model.number="mainCharacteristics[field.key].ticks"
                          type="number"
                          :label="`${field.label} ticks (+5%/tick)`"
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
                <ion-input data-testid="edit-actions-ticks-input" v-model.number="actionsTicks" type="number" label="Ticks A (+1/tick)" label-placement="stacked" />
              </ion-item>
              <ion-item>
                <ion-input data-testid="edit-movement-input" v-model.number="movement" type="number" label="Mouvement (M)" label-placement="stacked" />
              </ion-item>
              <ion-item>
                <ion-input data-testid="edit-magic-input" v-model.number="magic" type="number" label="Magie (Mag)" label-placement="stacked" />
              </ion-item>
              <ion-item>
                <ion-input data-testid="edit-magic-ticks-input" v-model.number="magicTicks" type="number" label="Ticks Mag (+1/tick)" label-placement="stacked" />
              </ion-item>
              <ion-item>
                <ion-input data-testid="edit-bf-ticks-input" v-model.number="bonusForceTicks" type="number" label="Ticks BF (+1/tick)" label-placement="stacked" />
              </ion-item>
              <ion-item>
                <ion-input data-testid="edit-insanity-input" v-model.number="insanity" type="number" label="Points de Folie (PF)" label-placement="stacked" />
              </ion-item>
            </div>
          </ion-accordion>

          <ion-accordion value="careers" data-testid="section-careers">
            <ion-item slot="header" color="light" data-testid="section-careers-header">
              <ion-label>Carrières</ion-label>
            </ion-item>
            <div slot="content" class="section-content">
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
            </div>
          </ion-accordion>

          <ion-accordion value="abilities" data-testid="section-abilities">
            <ion-item slot="header" color="light" data-testid="section-abilities-header">
              <ion-label>Compétences et Talents</ion-label>
            </ion-item>
            <div slot="content" class="section-content">
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
                <ion-select
                  :data-testid="`edit-skill-mastery-${index}`"
                  :value="skill.mastery"
                  label="Maîtrise"
                  label-placement="stacked"
                  @ionChange="setSkillMastery(index, $event.detail.value as number | null)"
                >
                  <ion-select-option
                    v-for="option in skillMasteryOptions"
                    :key="`mastery-${option.value}`"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </ion-select-option>
                </ion-select>
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
            </div>
          </ion-accordion>

          <ion-accordion value="equipment" data-testid="section-equipment">
            <ion-item slot="header" color="light" data-testid="section-equipment-header">
              <ion-label>Équipement</ion-label>
            </ion-item>
            <div slot="content" class="section-content">
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
            </div>
          </ion-accordion>
        </ion-accordion-group>

        <ion-button data-testid="save-editor-button" expand="block" class="ion-margin-top" @click="onSave">Sauvegarder</ion-button>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonAccordion,
  IonAccordionGroup,
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
  SKILL_MASTERY_OPTIONS,
  TALENT_CATALOG,
  formatNameWithSpecialization,
  formatSkillLabel,
  formatTalentLabel,
  patchCareers,
  type RaceKey,
  type CharacterSkill,
  type CharacterTalent,
  type CharacteristicKey,
  type Characteristics,
  patchInventory,
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
const woundsMax = ref(0)
const actions = ref(1)
const actionsTicks = ref(0)
const movement = ref(4)
const magic = ref(0)
const magicTicks = ref(0)
const bonusForceTicks = ref(0)
const insanity = ref(0)
const skills = ref<CharacterSkill[]>([])
const talents = ref<CharacterTalent[]>([])
const currentCareer = ref<string | null>(null)
const previousCareers = ref<string[]>([])
const selectedSkillId = ref<string>('')
const selectedTalentId = ref<string>('')
const selectedPreviousCareer = ref<string>('')
const mainCharacteristics = reactive<Characteristics>({
  cc: { base: 30, advance: 0, ticks: 0 },
  ct: { base: 30, advance: 0, ticks: 0 },
  f: { base: 30, advance: 0, ticks: 0 },
  e: { base: 30, advance: 0, ticks: 0 },
  ag: { base: 30, advance: 0, ticks: 0 },
  int: { base: 30, advance: 0, ticks: 0 },
  fm: { base: 30, advance: 0, ticks: 0 },
  soc: { base: 30, advance: 0, ticks: 0 }
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
const skillMasteryOptions = SKILL_MASTERY_OPTIONS

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
      advance: Math.max(0, Math.trunc(value.cc.advance)),
      ticks: Math.max(0, Math.trunc(value.cc.ticks))
    },
    ct: {
      base: Math.max(0, Math.trunc(value.ct.base)),
      advance: Math.max(0, Math.trunc(value.ct.advance)),
      ticks: Math.max(0, Math.trunc(value.ct.ticks))
    },
    f: {
      base: Math.max(0, Math.trunc(value.f.base)),
      advance: Math.max(0, Math.trunc(value.f.advance)),
      ticks: Math.max(0, Math.trunc(value.f.ticks))
    },
    e: {
      base: Math.max(0, Math.trunc(value.e.base)),
      advance: Math.max(0, Math.trunc(value.e.advance)),
      ticks: Math.max(0, Math.trunc(value.e.ticks))
    },
    ag: {
      base: Math.max(0, Math.trunc(value.ag.base)),
      advance: Math.max(0, Math.trunc(value.ag.advance)),
      ticks: Math.max(0, Math.trunc(value.ag.ticks))
    },
    int: {
      base: Math.max(0, Math.trunc(value.int.base)),
      advance: Math.max(0, Math.trunc(value.int.advance)),
      ticks: Math.max(0, Math.trunc(value.int.ticks))
    },
    fm: {
      base: Math.max(0, Math.trunc(value.fm.base)),
      advance: Math.max(0, Math.trunc(value.fm.advance)),
      ticks: Math.max(0, Math.trunc(value.fm.ticks))
    },
    soc: {
      base: Math.max(0, Math.trunc(value.soc.base)),
      advance: Math.max(0, Math.trunc(value.soc.advance)),
      ticks: Math.max(0, Math.trunc(value.soc.ticks))
    }
  }
}

const fillForm = (current: Character): void => {
  name.value = current.name
  race.value = current.race
  woundsMax.value = current.wounds.max
  Object.assign(mainCharacteristics, structuredClone(current.characteristics))
  actions.value = current.actions
  actionsTicks.value = current.actionsTicks
  movement.value = current.movement
  magic.value = current.magic
  magicTicks.value = current.magicTicks
  bonusForceTicks.value = current.bonusForceTicks
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
    woundsMax: woundsMax.value
  })

  const withInventory = patchInventory(patched, inventory.value)
  const withSkills = patchSkills(withInventory, skills.value)
  const withTalents = patchTalents(withSkills, talents.value)
  const withCareers = patchCareers(withTalents, {
    current: currentCareer.value,
    previous: previousCareers.value
  })
  const withCharacteristics = normalizeMainCharacteristics(mainCharacteristics)

  const next: Character = {
    ...withCareers,
    race: race.value,
    characteristics: withCharacteristics,
    actions: Math.max(1, Math.trunc(actions.value)),
    actionsTicks: Math.max(0, Math.trunc(actionsTicks.value)),
    movement: Math.max(1, Math.trunc(movement.value)),
    magic: Math.max(0, Math.trunc(magic.value)),
    magicTicks: Math.max(0, Math.trunc(magicTicks.value)),
    bonusForceTicks: Math.max(0, Math.trunc(bonusForceTicks.value)),
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
    specialization: selected.specialization,
    mastery: 0
  })

  selectedSkillId.value = ''
}

const removeSkill = (index: number): void => {
  skills.value = skills.value.filter((_, i) => i !== index)
}

const setSkillMastery = (index: number, mastery: number | null): void => {
  if (mastery !== 0 && mastery !== 10 && mastery !== 20) {
    return
  }

  skills.value = skills.value.map((skill, skillIndex) =>
    skillIndex === index ? { ...skill, mastery } : skill
  )
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
