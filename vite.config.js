import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',        // Escucha en todas las interfaces (accesible desde la red local)
    port: 5173,
    open: false,
    allowedHosts: ['dogvet.programa.com','dogvet.portalvets.com','upsvet.portalvets.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // Backend en el mismo contenedor
        changeOrigin: false,                // Mantiene el header Host original (con subdominio)
        // rewrite: (path) => path.replace(/^\/api/, '') // No es necesario porque el backend espera /api
      },
      '/uploads': {  // <-- Agrega esta línea
        target: 'http://localhost:5000',
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/uploads/, '/uploads')
      }
    }
  }
})