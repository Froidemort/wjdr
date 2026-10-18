<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CalendarDays } from '@lucide/vue'
import { useCurrentContext } from '../../composables/useCurrentContext'
import { mainNavLinks, resolveNavTo } from '../../config/navLinks'

const props = defineProps<{ publicOnly?: boolean }>()

const route = useRoute()
const { campaign, campaignTo, sessionTo, navContext } = useCurrentContext()

const links = computed(() =>
  mainNavLinks
    .filter((link) => !props.publicOnly || link.public)
    .map((link) => {
      const to = resolveNavTo(link, navContext.value)
      const prefix = link.activePrefix ?? to
      return {
        ...link,
        to,
        available: Boolean(to),
        active: Boolean(prefix && (route.path === prefix || route.path.startsWith(`${prefix}/`))),
      }
    }),
)
</script>

<template>
  <nav aria-label="Navigation principale" class="flex items-center gap-1">
    <component
      :is="link.available ? RouterLink : 'span'"
      v-for="link in links"
      :key="link.label"
      :to="link.available ? link.to : undefined"
      class="group relative flex min-h-11 items-center gap-2 px-3.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-200"
      :class="{
        'text-primary': link.active,
        'text-base-content/70 hover:text-primary': link.available && !link.active,
        'cursor-default text-base-content/35': !link.available,
      }"
      :aria-disabled="link.available ? undefined : 'true'"
      :title="link.available ? undefined : 'Bientôt disponible'"
    >
      <component :is="link.icon" class="size-4 shrink-0" aria-hidden="true" />
      <span>{{ link.label }}</span>

      <!-- Underline indicator — grows in on hover / stays full when active -->
      <span
        v-if="link.available"
        class="absolute inset-x-2 bottom-1.5 h-px origin-center bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
        :class="link.active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"
        aria-hidden="true"
      />
    </component>

    <!-- Current campaign chip, with a shortcut to the current session -->
    <div
      v-if="!publicOnly && campaign && campaignTo"
      class="ml-2 hidden items-center gap-1 lg:flex"
      data-testid="current-campaign-chip"
    >
      <router-link
        :to="campaignTo"
        class="badge badge-outline badge-lg max-w-48 gap-1.5 hover:border-primary hover:text-primary"
        :title="`Campagne en cours : ${campaign.name}`"
      >
        <span class="truncate">{{ campaign.name }}</span>
      </router-link>
      <router-link
        v-if="sessionTo"
        :to="sessionTo"
        class="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
        aria-label="Session en cours"
        title="Session en cours"
      >
        <CalendarDays class="size-4" aria-hidden="true" />
      </router-link>
    </div>
  </nav>
</template>
