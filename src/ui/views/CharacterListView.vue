<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>Warhammer Sheet</ion-title>
      </ion-toolbar>
    </ion-header>

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
          <ion-button data-testid="create-character-button" expand="block" class="ion-margin-top" @click="onCreateCharacter">
            Creer et ouvrir
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-list inset>
        <ion-list-header>Personnages</ion-list-header>
        <ion-item v-for="character in characters" :key="character.id" :data-testid="`character-row-${character.id}`" button @click="openCharacter(character.id)">
          <ion-label>
            <h2>{{ character.name }}</h2>
            <p>
              PV {{ character.wounds.current }}/{{ character.wounds.max }} | Fortune {{ character.fortune }} | Destin {{ character.fate }}
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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter
} from '@ionic/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Character } from '../../domain/character'
import { createAndSaveCharacter, deleteCharacter, listCharacters } from '../../repositories/characterRepository'

const router = useRouter()

const newName = ref('')
const characters = ref<Character[]>([])

const refreshCharacters = async (): Promise<void> => {
  characters.value = await listCharacters()
}

onIonViewWillEnter(() => {
  void refreshCharacters()
})

const onCreateCharacter = async (): Promise<void> => {
  const trimmed = newName.value.trim()
  if (!trimmed) {
    return
  }

  const character = await createAndSaveCharacter(trimmed)
  newName.value = ''
  await router.push(`/character/${character.id}`)
}

const openCharacter = (id: string): void => {
  void router.push(`/character/${id}`)
}

const onDeleteCharacter = async (id: string): Promise<void> => {
  await deleteCharacter(id)
  await refreshCharacters()
}
</script>
