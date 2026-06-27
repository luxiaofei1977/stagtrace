import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: '鹿迹 StagTrace',
        short_name: '鹿迹',
        description: '鹿角蕨生长记录 PWA 应用',
        theme_color: '#2d6a4f',
        background_color: '#f0fdf4',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // 关键：navigateFallback 使用 NetworkFirst，确保用户访问时优先拉取最新 HTML
        // 搭配 autoUpdate：SW 检测到新版本自动 skipWaiting + clients.claim，用户刷新即见新版
        navigateFallback: null,
        runtimeCaching: [
          {
            // 图片：缓存优先，30 天过期
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            // JS/CSS 构建产物：StaleWhileRevalidate，每次后台更新
            // precache 已覆盖所有构建产物（含 hash），此处仅兜底非 precache 资源
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            // HTML 文档请求：NetworkFirst，确保优先从网络获取最新版本
            // 网络失败时回退到缓存，保证离线可用
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 1 }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
