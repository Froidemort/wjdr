import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { applyAppSplashCssVars } from './ui/config/appSplash'
import router from './ui/router'
import './ui/theme/theme.css'
import App from './App.vue'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const themeStore = useThemeStore(pinia)

themeStore.initTheme()
applyAppSplashCssVars()
app.mount('#app')
