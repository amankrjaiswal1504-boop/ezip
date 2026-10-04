import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // Pre-bundle heavy deps up front so the dev server doesn't reload mid-session.
  optimizeDeps: {
    include: ['react-leaflet', 'leaflet', 'react-markdown', 'socket.io-client', 'lucide-react', 'axios', 'react-hot-toast'],
  },
  build: {
    // Split heavy vendor code so pages load faster (Lighthouse).
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          map: ['leaflet', 'react-leaflet'],
          markdown: ['react-markdown'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
  },
});
