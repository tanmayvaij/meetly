import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: [
      "1566-103-132-151-108.ngrok-free.app"
    ],
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      }
    }
  }
})
