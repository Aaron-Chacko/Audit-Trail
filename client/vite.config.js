import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Proxy API calls to the Express backend during local development.
  // This avoids CORS issues in dev and keeps the client free of hardcoded ports.
  // In production, configure your reverse proxy / hosting layer instead.
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Resolve alias so imports look clean: @/components/... instead of ../../components/...
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
