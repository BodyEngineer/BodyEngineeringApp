import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',

      registerType: 'autoUpdate',

      devOptions: {
        enabled: true,
        type: 'module',
      },

      manifest: {
        name: 'Body Engineering',
        short_name: 'Body Engineering',
        description: 'Body Engineering Female Fitness Studio',
        theme_color: '#080808',
        background_color: '#080808',
        display: 'standalone',
        id: '/member-login',
        start_url: '/member-login',
        scope: '/',

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
