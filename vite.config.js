import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        'rapa-case-study': 'rapa-case-study.html',
        'kinovibe-case-study': 'kinovibe-case-study.html',
        'invoice-generator-case-study': 'invoice-generator-case-study.html',
      },
    },
  },
})
