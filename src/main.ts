import { createPinia } from 'pinia'
import { createApp } from 'vue'
import router from './ui/router'
import './ui/theme/theme.css'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore(pinia)
const themeStore = useThemeStore(pinia)

themeStore.initTheme()
app.mount('#app')
void authStore.initAuth().catch(() => {
  // Router guards and UI can continue without a warm auth cache.
})
