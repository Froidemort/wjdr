import { createApp } from 'vue'
import router from './ui/router'
import './ui/theme/theme.css'
import App from './App.vue'

createApp(App)
  .use(router)
  .mount('#app')