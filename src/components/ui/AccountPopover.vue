<script setup lang="ts">
import { UserCircle } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { usePopoverPanel } from '../../composables/usePopoverPanel'

// Desktop-only account menu: display name on the trigger, actions only in the dropdown.
const emit = defineEmits<{
  open: []
}>()

const authStore = useAuthStore()
const router = useRouter()
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const { isOpen, close, toggle } = usePopoverPanel({
  rootRef,
  triggerRef,
  onOpen: () => emit('open'),
})

const avatarUrl = computed(() => authStore.avatarUrl)
const displayName = computed(() => authStore.displayName)
const ariaLabel = computed(() =>
  displayName.value ? `Menu compte — ${displayName.value}` : 'Menu compte',
)

async function onLogout(): Promise<void> {
  close()
  await authStore.signOut()
  await router.replace('/')
}

defineExpose({ close })
</script>

<template>
  <div ref="rootRef" class="relative hidden sm:block">
    <button
      ref="triggerRef"
      type="button"
      class="btn btn-ghost min-h-11 gap-2.5 px-3 font-medium normal-case"
      :aria-label="ariaLabel"
      aria-haspopup="menu"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click="toggle"
    >
      <div v-if="avatarUrl" class="avatar">
        <div class="w-8 rounded-full">
          <img :src="avatarUrl" alt="" class="object-cover" />
        </div>
      </div>
      <UserCircle v-else class="size-5 opacity-70" />
      <span class="hidden max-w-32 truncate md:inline">{{ displayName || 'Compte' }}</span>
    </button>

    <ul
      v-if="isOpen"
      class="menu absolute right-0 top-12 z-50 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
      role="menu"
    >
      <li>
        <router-link to="/profile" @click="close">Profil</router-link>
      </li>
      <li>
        <button type="button" class="text-error" @click="onLogout">Se déconnecter</button>
      </li>
    </ul>
  </div>
</template>
