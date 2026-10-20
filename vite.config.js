import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => ({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/reactjsbabysitterbookingplatformfrontend/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    restoreMocks: true,
    clearMocks: true,
  },
}))
