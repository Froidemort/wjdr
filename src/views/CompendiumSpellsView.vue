<script setup lang="ts">


import { ref, computed } from 'vue';

const searchQuery = ref('');

const filteredData = computed(() => {
    if (!searchQuery.value) return data;
    return data.filter(spell => spell.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

// TODO : Put these types definition in type directory

type category = {
    name: string, // name of the category (Magie commune, magie mineure, etc.)
    description?: string, // description of the category, optional
}


type Spell = {
    name: string, // name of the spell
    description?: string, // description of the spell, optional
    difficulty: number, // difficulty score of the spell
    cast_time: string, // time required to cast the spell
    category: category, // category of the spell
    domain_category?: Array<string>, // domain category of the spell, optional
    damage?: number, // damage dealt by the spell, optional
    duration?: string, // duration of the spell, optional
}

// TODO: example categories for the spells, must be replaced by Supabase calls later
const categories: Array<category> = [
    {
        name: 'Magie commune (occulte)',
        description: 'Sorts de magie commune occulte',
    },
    {
        name: 'Magie mineure (occulte)',
        description: 'Sorts de magie mineure occulte',
    },
    {
        name: 'Magie divine de Shallya',
        description: 'Sorts de magie divine de la déesse Shallya',
    },
    {
        name: 'Domaine du feu',
        description: 'Sorts de flamme',
    },
    {
        name: 'Domaine des Ombres',
        description: 'Sorts des ombres',
    },
]


// Example data for the compendium of spells, must be replaced by Supabase calls later.
const data: Array<Spell> = [
    {
        name: 'Manteau d\'Ombres',
        description: 'Un sort qui enveloppe le lanceur dans des ombres, le rendant difficile à détecter.',
        difficulty: 8,
        cast_time: '1/2 action',
        duration: '1 minute / point de magie',
        category: categories.find(cat => cat.name === 'Domaine des Ombres') ?? categories[0],
    },
    {
        name: 'Conflagration Fatale',
        description: 'Un sort qui déclenche une explosion de feu dévastatrice.',
        difficulty: 24,
        damage: 8,
        cast_time: '1 action complète',
        duration: 'Tant qu\'il y a des ennemis dans la zone d\'effet',
        category: categories.find(cat => cat.name === 'Domaine du feu') ?? categories[0],
    },
    {
        name: 'Usure du temps',
        description: 'Un sort qui accélère le vieillissement des objets ou des créatures.',
        difficulty: 11,
        cast_time: '1 action complète',
        duration: 'Instantané',
        category: categories.find(cat => cat.name === 'Domaine du feu') ?? categories[0],
    },
    {
        name: 'Guérison de la folie',
        description: 'Un sort qui soigne les afflictions mentales et la folie.',
        difficulty: 12,
        cast_time: '1 minute',
        category: categories.find(cat => cat.name === 'Magie divine de Shallya') ?? categories[0],
    }
]

</script>


<template>
  <section>
    <h2 class="p-4 m-4">Compendium des sorts</h2>
    <div class="border border-secondary flex flex-wrap">
        <!-- Filters-->
        <!-- Search bar-->
        <input type="text" placeholder="Rechercher un sort..." class="input input-bordered w-full mb-4" v-model="searchQuery">
        <div class="dropdown">
  <div tabindex="0" role="button" class="btn m-1">Collèges ou Divinités</div>
  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
    <template v-for="category in categories" :key="category.name">
      <li>
        <label class="label cursor-pointer flex gap-2">
          <span class="label-text">{{ category.name }}</span>
          <input type="checkbox" class="checkbox checkbox-sm" />
        </label>
      </li>
    </template>
  </ul>
</div>
    </div>
    <div class="p-4">
        <template v-for="spell in filteredData" :key="spell.name">
            <div class="card card-border bg-base-200 text-base-content p-4 m-4" :spell="spell">
                <div class="card-body">
                    <h3 class="card-title">{{ spell.name }}</h3>
                    <p class="card-text" v-if="spell.description">{{ spell.description }}</p>
                    <p class="card-text">Difficulté : <span class="badge text-accent">{{ spell.difficulty }}</span></p>
                    <p class="card-text" v-if="spell.cast_time">Temps d'incantation : {{ spell.cast_time }}</p>
                    
                    <div class="tooltip tooltip-top" :data-tip="spell?.category?.description ? spell.category.description : 'No description'"></div><p class="card-text" v-if="spell.category">Catégorie : {{ spell.category.name }}</p>
                    
                    <p class="card-text" v-if="spell.damage">Dégâts : <span class="badge text-accent">{{ spell.damage }}</span></p>
                    <p class="card-text" v-if="spell.duration">Durée : {{ spell.duration }}</p>
                </div>
            </div>

        </template>
    </div>
  </section>
</template>

<style lang="css" scoped></style>