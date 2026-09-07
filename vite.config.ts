import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/** Na GitHub Pages ustaw VITE_BASE=/panda-ninja/ — lokalnie zostaje /. */
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['art/**/*.png', 'art/**/*.webp', 'icons/*.png', 'manifest.webmanifest'],
      // panda-v2 ma PNG tylko jako fallback dla starych Safari — do cache'u
      // idzie sam WebP, inaczej iPad ciągnie ~34 MB duplikatów offline.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,webmanifest,ico}'],
        globIgnores: ['**/art/panda-v2/**/*.png'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
