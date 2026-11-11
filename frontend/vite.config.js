import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL: Use relative paths so assets load correctly in the packaged Electron app
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
