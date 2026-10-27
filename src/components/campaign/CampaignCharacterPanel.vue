<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import type { CampaignTableEntry } from '../../composables/useCampaignTable'
import { formatMoney, formatNamedWithSpecialization } from '../../utils/characterSheet'

defineProps<{
  entry: CampaignTableEntry
  collapsible: boolean
}>()
</script>

<template>
  <component
    :is="collapsible ? 'details' : 'div'"
    class="rounded-box border border-base-300 bg-base-100"
    :class="{ 'collapse collapse-arrow': collapsible }"
    :data-testid="`table-character-${entry.character.id}`"
  >
    <component
      :is="collapsible ? 'summary' : 'header'"
      class="space-y-2 p-3"
      :class="{ 'collapse-title min-h-11': collapsible }"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="truncate font-semibold leading-tight">{{ entry.character.name }}</h3>
          <p class="truncate text-xs capitalize opacity-70">
            {{ entry.character.race }} · {{ entry.character.careerName || 'Carrière inconnue' }}
          </p>
        </div>
        <router-link
          v-if="!collapsible"
          :to="`/characters/${entry.character.id}`"
          class="btn btn-ghost btn-sm min-h-11 gap-1"
          :aria-label="`Ouvrir la fiche de ${entry.character.name}`"
        >
          <ExternalLink class="h-4 w-4" />
          Fiche
        </router-link>
      </div>
      <ul class="flex flex-wrap gap-1.5 text-xs" aria-label="Constantes vitales">
        <li class="badge badge-error badge-soft">
          PV {{ entry.character.pvCurrent }}/{{ entry.character.pvMax }}
        </li>
        <li class="badge badge-success badge-soft">
          Fortune {{ entry.character.fortuneCurrent }}/{{ entry.character.fortuneMax }}
        </li>
        <li class="badge badge-info badge-soft">
          Destin {{ entry.character.destinyCurrent }}/{{ entry.character.destinyMax }}
        </li>
      </ul>
    </component>

    <div class="space-y-3 px-3 pb-3" :class="{ 'collapse-content': collapsible }">
      <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt class="opacity-70">Folie</dt>
        <dd class="text-right font-semibold tabular-nums">{{ entry.character.insanityPoints }}</dd>
        <dt class="opacity-70">XP</dt>
        <dd class="text-right font-semibold tabular-nums">
          {{ entry.character.xpAvailable }}/{{ entry.character.xpTotal }}
        </dd>
        <dt class="opacity-70">Argent</dt>
        <dd class="text-right font-semibold tabular-nums">
          {{
            formatMoney(
              entry.character.moneyGold,
              entry.character.moneySilver,
              entry.character.moneyCopper
            )
          }}
        </dd>
        <dt class="opacity-70">Encombrement</dt>
        <dd
          class="text-right font-semibold tabular-nums"
          :class="{ 'text-error': entry.highlights.totalEncumbrance > entry.highlights.maxEncumbrance }"
        >
          {{ entry.highlights.totalEncumbrance }}/{{ entry.highlights.maxEncumbrance }}
        </dd>
      </dl>

      <div v-if="entry.highlights.mainStats.length > 0" class="grid grid-cols-4 gap-1.5">
        <div
          v-for="stat in entry.highlights.mainStats"
          :key="stat.statCode"
          class="rounded-box border border-base-300 bg-base-200 px-1 py-0.5 text-center"
        >
          <div class="text-[10px] font-semibold uppercase opacity-70">{{ stat.statCode }}</div>
          <div class="font-black tabular-nums">{{ stat.value }}</div>
        </div>
      </div>

      <section class="space-y-1">
        <h4 class="text-xs font-semibold uppercase tracking-wide opacity-70">Armes équipées</h4>
        <ul v-if="entry.highlights.equippedWeapons.length > 0" class="space-y-0.5 text-sm">
          <li v-for="weapon in entry.highlights.equippedWeapons" :key="weapon.id">
            {{ weapon.name }}
            <span v-if="weapon.damageFormula" class="opacity-70">({{ weapon.damageFormula }})</span>
          </li>
        </ul>
        <p v-else class="text-sm opacity-70">Aucune.</p>
      </section>

      <section class="space-y-1">
        <h4 class="text-xs font-semibold uppercase tracking-wide opacity-70">Armures équipées</h4>
        <ul v-if="entry.highlights.equippedArmors.length > 0" class="space-y-0.5 text-sm">
          <li v-for="armor in entry.highlights.equippedArmors" :key="armor.id">
            {{ armor.name }} <span class="opacity-70">(PA {{ armor.armorPoints }})</span>
          </li>
        </ul>
        <p v-else class="text-sm opacity-70">Aucune.</p>
      </section>

      <section class="space-y-1">
        <h4 class="text-xs font-semibold uppercase tracking-wide opacity-70">Talents</h4>
        <div v-if="entry.highlights.talents.length > 0" class="flex flex-wrap gap-1">
          <span
            v-for="talent in entry.highlights.talents"
            :key="talent.talentId"
            class="badge badge-outline badge-sm h-auto whitespace-normal text-left"
          >
            {{ formatNamedWithSpecialization(talent.name, talent.specialization) }}
          </span>
          <span v-if="entry.highlights.hiddenTalentCount > 0" class="badge badge-ghost badge-sm">
            +{{ entry.highlights.hiddenTalentCount }}
          </span>
        </div>
        <p v-else class="text-sm opacity-70">Aucun.</p>
      </section>

      <section class="space-y-1">
        <h4 class="text-xs font-semibold uppercase tracking-wide opacity-70">Compétences</h4>
        <div v-if="entry.highlights.skills.length > 0" class="flex flex-wrap gap-1">
          <span
            v-for="skill in entry.highlights.skills"
            :key="skill.skillId"
            class="badge badge-outline badge-sm h-auto whitespace-normal text-left"
          >
            {{ formatNamedWithSpecialization(skill.name, skill.specialization) }}
            <span v-if="skill.masteryLevel > 1" class="font-bold">
              +{{ (skill.masteryLevel - 1) * 10 }}%
            </span>
          </span>
          <span v-if="entry.highlights.hiddenSkillCount > 0" class="badge badge-ghost badge-sm">
            +{{ entry.highlights.hiddenSkillCount }}
          </span>
        </div>
        <p v-else class="text-sm opacity-70">Aucune.</p>
      </section>

      <router-link
        v-if="collapsible"
        :to="`/characters/${entry.character.id}`"
        class="btn btn-outline btn-sm min-h-11 w-full gap-1"
      >
        <ExternalLink class="h-4 w-4" />
        Ouvrir la fiche
      </router-link>
    </div>
  </component>
</template>
