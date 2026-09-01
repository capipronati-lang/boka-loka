import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: { exclude: ["sql.js"] },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
