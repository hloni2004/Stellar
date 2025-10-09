import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
    'process.env': {},
    'Buffer': 'Buffer',
  },
  server: {
    port: 5173,
    host: true, // This allows access from other devices on the network
    open: true, // This automatically opens the browser
    proxy: {
      // Proxy API requests to the backend during development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})