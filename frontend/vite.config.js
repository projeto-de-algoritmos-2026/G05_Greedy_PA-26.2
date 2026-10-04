import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O backend (FastAPI) roda na porta 8000; o proxy evita problemas de CORS em dev.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
