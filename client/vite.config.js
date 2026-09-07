import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { dirname, resolve } from 'node:path'
import dotenv from 'dotenv'

// Load the project-root .env so the Vite proxy reads the actual server PORT
// from the existing server configuration (server/src/config/index.js uses the
// same file). Do NOT hardcode a random port — fallback matches server default.
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const serverPort = process.env.PORT || '5000'
const apiTarget = process.env.VITE_PROXY_TARGET || `http://localhost:${serverPort}`

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,

    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('@tanstack')) return 'vendor-query'
            if (
              id.includes('react-hook-form') ||
              id.includes('@hookform') ||
              id.includes('zod')
            ) {
              return 'vendor-forms'
            }
            if (id.includes('axios')) return 'vendor-axios'
            if (id.includes('zustand')) return 'vendor-zustand'
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (
              id.includes('sonner') ||
              id.includes('class-variance') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')
            ) {
              return 'vendor-ui'
            }

            return 'vendor'
          }
        },
      },
    },
  },
})