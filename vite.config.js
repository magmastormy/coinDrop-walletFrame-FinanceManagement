import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react'
          }
          if (id.includes('chart.js')) {
            return 'charts'
          }
          if (id.includes('axios') || id.includes('react-redux')) {
            return 'vendors'
          }
          if (id.includes('@fortawesome')) {
            return 'fonts'
          }
        }
      }
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    sourcemap: true,
    target: 'esnext',
    cssCodeSplit: false
  },
  optimizeDeps: {
    include: []
  }
})
