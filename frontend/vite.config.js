import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build goes straight into ../static so Flask can serve it in production.
// In dev (npm run dev) API calls are proxied to the Flask server on :5000.
export default defineConfig({
  plugins: [react()],
  base: '/static/',
  build: { outDir: '../static', emptyOutDir: true },
  server: { proxy: { '/api': 'http://localhost:5000' } },
})
