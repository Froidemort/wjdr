<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>
          <ion-icon :icon="peopleCircleOutline" />
          Warhammer Character Sheet
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-list inset>
      <ion-list-header>Personnages</ion-list-header>
      <ion-item
        v-for="character in characters"
        :key="character.id"
        :data-testid="`character-row-${character.id}`"
        button
        @click="openCharacter(character.id)"
      >
        <ion-label>
          <h2>
            <span class="list-name-with-race">
              <span :data-testid="`character-race-icon-${character.id}`">{{ getCharacterRaceIcon(character.race) }}</span>
              <span>{{ character.name }}</span>
            </span>
          </h2>
          <p>
            <span :data-testid="`character-race-value-${character.id}`">{{ getCharacterRaceLabel(character.race) }}</span> |
            PV {{ character.wounds.current }}/{{ character.wounds.max }} |
            Fortune {{ character.fortune.current }}/{{ character.fortune.max }} |
            Destin {{ character.fate.current }}/{{ character.fate.max }}
          </p>
        </ion-label>
        <ion-button
          slot="end"
          :data-testid="`delete-character-${character.id}`"
          color="danger"
          fill="clear"
          @click.stop="onDeleteCharacter(character.id)"
        >
          Supprimer
        </ion-button>
      </ion-item>
      <ion-item v-if="characters.length === 0">
        <ion-label>Aucun personnage. Cree le premier.</ion-label>
      </ion-item>
    </ion-list>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Nouveau personnage</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-input
              data-testid="character-name-input"
              v-model="newName"
              label="Nom"
              label-placement="stacked"
              placeholder="Ex: Konrad l'Audacieux"
            />
          </ion-item>
          <ion-button
            data-testid="create-character-button"
            expand="block"
            class="ion-margin-top"
            @click="onCreateCharacter"
          >
            Créer
          </ion-button>
          <input
            ref="importInput"
            data-testid="import-json-input"
            accept="application/json,.json"
            hidden
            type="file"
            @change="onImportFile"
          />
          <ion-button
            data-testid="import-json-button"
            expand="block"
            fill="outline"
            class="ion-margin-top"
            @click="openImportDialog"
          >
            Importer JSON
          </ion-button>
          <ion-note
            v-if="importError"
            color="danger"
            class="ion-padding-top"
            data-testid="import-json-error"
          >
            {{ importError }}
          </ion-note>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from "@ionic/vue";
import { peopleCircleOutline } from "ionicons/icons";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getRaceIcon, getRaceLabel, type Character, type RaceKey } from "../../domain/character";
import {
  createAndSaveCharacter,
  deleteCharacter,
  importCharacterFromJson,
  listCharacters,
} from "../../repositories/characterRepository";

const router = useRouter();

const newName = ref("");
const characters = ref<Character[]>([]);
const importError = ref("");
const importInput = ref<HTMLInputElement>();

const refreshCharacters = async (): Promise<void> => {
  characters.value = await listCharacters();
};

onIonViewWillEnter(() => {
  void refreshCharacters();
});

const onCreateCharacter = async (): Promise<void> => {
  const trimmed = newName.value.trim();
  if (!trimmed) {
    return;
  }

  const character = await createAndSaveCharacter(trimmed);
  newName.value = "";
  await router.push(`/character/${character.id}`);
};

const openImportDialog = (): void => {
  importError.value = "";
  importInput.value?.click();
};

const onImportFile = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  try {
    const json = await file.text();
    const character = await importCharacterFromJson(json);
    target.value = "";
    await refreshCharacters();
    await router.push(`/character/${character.id}`);
  } catch {
    importError.value = "Import JSON invalide.";
    target.value = "";
  }
};

const openCharacter = (id: string): void => {
  void router.push(`/character/${id}`);
};

const onDeleteCharacter = async (id: string): Promise<void> => {
  await deleteCharacter(id);
  await refreshCharacters();
};

const getCharacterRaceLabel = (race: RaceKey): string => getRaceLabel(race);
const getCharacterRaceIcon = (race: RaceKey): string => getRaceIcon(race);
</script>

<style scoped>
.list-name-with-race {
  align-items: center;
  display: inline-flex;
  gap: 0.5rem;
}
</style>
