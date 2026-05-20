import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/dugun', // ÖNEMLİ: GitHub repository adın neyse buraya yazmalısın. Örn: '/wedding-app/'
})