import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'Comptoir Pressing & Blanchisserie',
        short_name: 'Comptoir',
        description: 'Gestion tactile de commandes de pressing et blanchisserie',
        theme_color: '#f6f8fb',
        background_color: '#f6f8fb',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: '/pwa-icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/pwa-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: { navigateFallback: 'index.html' }
    })
  ],
  server: { host: '0.0.0.0', allowedHosts: true }
});
