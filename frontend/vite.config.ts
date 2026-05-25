import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// O proxy encaminha as chamadas /api e /uploads para a API (porta 3333),
// permitindo que o frontend use caminhos relativos e evite problemas de CORS.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Sem service worker no dev server (evita interferir no Vite/E2E)
      devOptions: { enabled: false },
      manifest: {
        name: 'SkillEx — Troque habilidades',
        short_name: 'SkillEx',
        description:
          'Plataforma social de troca de habilidades. Ensine o que você sabe, aprenda o que deseja.',
        lang: 'pt-BR',
        display: 'standalone',
        start_url: '/',
        background_color: '#ffffff',
        theme_color: '#f97316',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        // API, uploads e WebSocket NUNCA passam pelo cache do service worker
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/socket\.io\//],
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // Usa a API moderna do Dart Sass (remove o aviso de "legacy JS API").
        api: 'modern-compiler',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3333',
      '/uploads': 'http://localhost:3333',
      // WebSocket (socket.io) — ws:true habilita o upgrade de protocolo
      '/socket.io': { target: 'http://localhost:3333', ws: true },
    },
  },
});
