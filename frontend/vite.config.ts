import { defineConfig } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req: IncomingMessage, res) => {
            if ((err as { code?: string }).code === 'ECONNREFUSED') {
              const r = res as ServerResponse
              if (!r.headersSent) {
                r.writeHead(502, { 'Content-Type': 'application/json' })
                r.end(JSON.stringify({ detail: 'backend unavailable' }))
              }
              return
            }
          })
        },
      },
    },
  },
  preview: {
    port: 3000,
    strictPort: false,
  },
})
