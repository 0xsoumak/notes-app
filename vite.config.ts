import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      // Notes live in IndexedDB and sync on demand, so the app is already
      // offline-capable — the service worker is what makes it *launchable*
      // offline rather than just usable once loaded.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      // The manifest is a real file at `public/manifest.webmanifest`, linked
      // from index.html. Generating it from here instead would mean app
      // identity lived in the build config, where it is neither greppable nor
      // editable without a rebuild.
      manifest: false,
      workbox: {
        // Every route is client-side, so an offline launch of /notes/... has
        // to resolve to the shell.
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,webmanifest}'],
        // BlockNote ships a large bundle; the default 2 MiB cap would silently
        // drop it from the precache and break offline launches.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // The GitHub API must always hit the network — a cached response would
        // make sync compare against a stale tree.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
      },
      devOptions: {
        // Off by default: a service worker in dev caches aggressively and
        // makes HMR confusing. Flip to true to test install behaviour locally.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
