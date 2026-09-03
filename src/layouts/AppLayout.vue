<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Footer from '../components/ui/Footer.vue'
import { useDeviceBreakpoint } from '../composables/useDeviceBreakpoint'
import DesktopLayout from './DesktopLayout.vue'
import MobileLayout from './MobileLayout.vue'

const route = useRoute()
const { isMobile } = useDeviceBreakpoint()

const layoutComponent = computed(() => (isMobile.value ? MobileLayout : DesktopLayout))
const showFooter = computed(() => !route.meta.hideFooter && !isMobile.value)
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <component :is="layoutComponent" class="flex-1">
      <slot />
    </component>

    <template v-if="showFooter">
      <Footer />
    </template>
  </div>
</template>
