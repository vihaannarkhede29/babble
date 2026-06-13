import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Babble is an offline-first PWA: the whole app (DSP, animation, game
// state) runs client-side with no backend, so it installs and works on a
// $35 Fire tablet with no connectivity. The service worker precaches the build.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Babble — Speech Coach',
        short_name: 'Babble',
        description: 'Real-time speech coaching for pre-readers.',
        theme_color: '#3bbfbf',
        background_color: '#f7f4ef',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
