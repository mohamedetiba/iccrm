import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' makes the build work on GitHub Pages under any repo name
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
