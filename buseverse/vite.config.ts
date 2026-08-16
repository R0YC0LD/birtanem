import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://r0yc0ld.github.io/birtanem/
// Lokal gelistirmede base '/' olur, production build'de '/birtanem/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/birtanem/' : '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
}))
