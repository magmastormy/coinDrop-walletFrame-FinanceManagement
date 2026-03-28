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
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['recharts'],
      treeshake: 'recommended',
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['chart.js'],
          vendors: ['axios', 'react-redux'],
          fonts: ["@fortawesome/fontawesome-svg-core", "@fortawesome/free-regular-svg-icons", "@fortawesome/free-solid-svg-icons", "@fortawesome/react-fontawesome"]
        }
      },
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    sourcemap: true,
    target: 'esnext',
    cssCodeSplit: false
  },
  optimizeDeps: {
    include: [
      '@mui/material/styles',
      '@mui/material/useTheme',
      '@mui/material/useMediaQuery'
    ]
  },
  define: {
    'process.env': {
      VITE_API_URL: process.env.VITE_API_URL,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
      NODE_ENV: process.env.NODE_ENV
    }
  }
})
