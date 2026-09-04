import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command }) => ({
  define: {
    __VUE_PROD_DEVTOOLS__: false,
  },
  plugins: [
    vue(),
    tailwindcss(),
    ...(command === 'serve' ? [vueDevTools()] : []),
  ],
  ...(command === 'serve' && {
    server: {
      host: '0.0.0.0',
    },
  }),
}))