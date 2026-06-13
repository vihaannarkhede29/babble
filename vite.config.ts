import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PhonicsForge is an offline-first PWA: the whole app (DSP, animation, game
// state) runs client-side with no backend, so it installs and works on a
// $35 Fire tablet with no connectivity. The service worker precaches the build.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'PhonicsForge — Speech Coach',
        short_name: 'PhonicsForge',
        description: 'Real-time speech coaching for pre-readers.',
        theme_color: '#6d28d9',
        background_color: '#0f0a1e',
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
