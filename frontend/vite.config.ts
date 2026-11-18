import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import type { OutputBundle } from 'rolldown';
import {defineConfig} from 'vite';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

function appServiceWorker() {
  const publicDirectory = path.resolve(configDirectory, 'public');
  const publicFiles: string[] = [];
  const listPublicFiles = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) listPublicFiles(absolutePath);
      else publicFiles.push(`/${path.relative(publicDirectory, absolutePath).replaceAll(path.sep, '/')}`);
    }
  };
  if (fs.existsSync(publicDirectory)) listPublicFiles(publicDirectory);
  return {
    name: 'app-service-worker',
    apply: 'build' as const,
    generateBundle(this: { emitFile: (file: { type: 'asset'; fileName: string; source: string }) => void }, _options: unknown, bundle: OutputBundle) {
      const initialAssets = Object.entries(bundle)
        .filter(([file, output]) => file !== 'sw.js' && (file.endsWith('.css') || (output.type === 'chunk' && output.isEntry)))
        .map(([file]) => `/${file}`);
      const precache = [...new Set(['/index.html', ...publicFiles, ...initialAssets])];
      const publicRevision = publicFiles.map(file => {
        const stats = fs.statSync(path.join(publicDirectory, file.slice(1)));
        return `${file}:${stats.size}:${stats.mtimeMs}`;
      });
      const cacheVersion = createHash('sha256').update(JSON.stringify([...precache, ...publicRevision])).digest('hex').slice(0, 10);
      const worker = `const CACHE = 'monitoramento-shell-${cacheVersion}';
const PRECACHE = ${JSON.stringify(precache)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('monitoramento-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => { if (response.ok) caches.open(CACHE).then(cache => cache.put('/index.html', response.clone())); return response; }).catch(async () => (await caches.match(request)) || (await caches.match('/index.html'))));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/data/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone())); return response; })));
  }
});`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: worker });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), appServiceWorker()],
    resolve: {
      alias: {
        '@': configDirectory,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
