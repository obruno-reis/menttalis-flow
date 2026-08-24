import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * The app is served at menttalis.com/flow, behind a Netlify rewrite from the
 * main (Next.js) site, so every emitted URL has to carry the /flow/ prefix.
 * Anything that builds a path at runtime must use import.meta.env.BASE_URL —
 * Vite only rewrites paths it can see at build time.
 */
const BASE = '/flow/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Menttalis Flow',
        short_name: 'Flow',
        description: 'Um espaço para focar, respirar e fazer uma coisa de cada vez.',
        theme_color: '#14253C',
        background_color: '#14253C',
        display: 'standalone',
        /* Must match where the app is actually served, or the installed app
           opens outside its own scope and loses the service worker. */
        start_url: BASE,
        scope: BASE,
        /* Relative to the manifest's own URL, so these survive a base change. */
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
