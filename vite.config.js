import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    rollupOptions: {
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
  }
})
