/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import pkg from './package.json' with { type: 'json' };

export default defineConfig(({ mode }) => ({
  // `--mode showcase`: hosted inside a sandboxed frame (relative paths, no service worker).
  // `--mode pages`: the public demo on GitHub Pages, served from /svefnvinur/.
  base: mode === 'showcase' ? './' : mode === 'pages' ? '/svefnvinur/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      disable: mode === 'showcase',
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg', 'coach.svg'],
      manifest: {
        name: 'Svefnvinur',
        short_name: 'Svefnvinur',
        description: 'Svefnráðgjöf fyrir börn: skráðu svefn, fylgdu dagsrytma og fáðu hjálp strax.',
        lang: 'is',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAF6EF',
        theme_color: '#FAF6EF',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
