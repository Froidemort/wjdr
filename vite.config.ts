import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
  return {
    plugins: [vue(), tailwindcss()],
    // Le bloc server n'est défini que pendant le développement local (npm run dev)
    ...(command === 'serve' && {
      server: {
        host: '0.0.0.0',
      },
    }),
  }
})
