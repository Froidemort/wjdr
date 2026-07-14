import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './ui/router'
import './ui/theme/theme.css'
import App from './App.vue'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore(pinia)
authStore.initAuth().finally(() => {
  app.mount('#app')
})