import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        target: 'es2020',
    },
    server: {
        host: true, // Allow external access in local network
        proxy: {
            '/api': {
                target: 'http://localhost:5002',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
