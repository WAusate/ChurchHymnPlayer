const CACHE_VERSION = 'belem-play-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const AUDIO_CACHE = `${CACHE_VERSION}-audio`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/logo.svg',
  '/detalhe-header.png',
  '/data/hymns/campanha.json',
  '/data/hymns/comissao.json',
  '/data/hymns/conjunto-musical.json',
  '/data/hymns/coral.json',
  '/data/hymns/criancas.json',
  '/data/hymns/grupo-jovem.json',
  '/data/hymns/proat.json',
  '/data/hymns/uniao-adolescentes.json'
];

const AUDIO_FILES = [
  '/audio/campanha/hino1.mp3',
  '/audio/campanha/hino2.mp3',
  '/audio/campanha/hino3.mp3',
  '/audio/campanha/hino4.mp3',
  '/audio/campanha/hino5.mp3',
  '/audio/comissao/hino1.mp3',
  '/audio/comissao/hino2.mp3',
  '/audio/comissao/hino3.mp3',
  '/audio/comissao/hino4.mp3',
  '/audio/comissao/hino5.mp3',
  '/audio/conjunto/hino1.mp3',
  '/audio/conjunto/hino2.mp3',
  '/audio/conjunto/hino3.mp3',
  '/audio/conjunto/hino4.mp3',
  '/audio/conjunto/hino5.mp3',
  '/audio/coral/hino1.mp3',
  '/audio/coral/hino2.mp3',
  '/audio/coral/hino3.mp3',
  '/audio/coral/hino4.mp3',
  '/audio/coral/hino5.mp3',
  '/audio/coral/hino6.mp3',
  '/audio/coral/hino7.mp3',
  '/audio/coral/hino8.mp3',
  '/audio/criancas/hino1.mp3',
  '/audio/criancas/hino2.mp3',
  '/audio/criancas/hino3.mp3',
  '/audio/criancas/hino4.mp3',
  '/audio/criancas/hino5.mp3',
  '/audio/jovem/hino1.mp3',
  '/audio/jovem/hino2.mp3',
  '/audio/jovem/hino3.mp3',
  '/audio/jovem/hino4.mp3',
  '/audio/jovem/hino5.mp3',
  '/audio/proat/hino1.mp3',
  '/audio/proat/hino2.mp3',
  '/audio/proat/hino3.mp3',
  '/audio/proat/hino4.mp3',
  '/audio/proat/hino5.mp3',
  '/audio/uniao/hino1.mp3',
  '/audio/uniao/hino2.mp3',
  '/audio/uniao/hino3.mp3',
  '/audio/uniao/hino4.mp3',
  '/audio/uniao/hino5.mp3'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  console.log('[SW] Total audio files to cache on first play:', AUDIO_FILES.length);
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => {
          console.error('[SW] Failed to cache some static assets:', err);
        });
    }).then(() => {
      console.log('[SW] Installation complete, skipping waiting');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.startsWith(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.protocol === 'chrome-extension:' || url.protocol === 'devtools:') {
    return;
  }

  if (url.pathname.includes('/src/') || url.pathname.includes('/@fs/') || 
      url.pathname.includes('/@vite/') || url.pathname.includes('/@react-refresh') ||
      url.pathname.includes('/@id/') || url.pathname.includes('/node_modules/')) {
    return;
  }

  if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.m4a') || url.pathname.endsWith('.ogg')) {
    event.respondWith(handleAudioRequest(request));
    return;
  }

  if (url.pathname.startsWith('/data/hymns/') && url.pathname.endsWith('.json')) {
    event.respondWith(handleHymnDataRequest(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

async function handleAudioRequest(request) {
  try {
    const cachedAudio = await caches.match(request);
    if (cachedAudio) {
      console.log('[SW] Serving audio from cache:', request.url);
      return cachedAudio;
    }

    console.log('[SW] Fetching and caching audio:', request.url);
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(AUDIO_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Error handling audio request:', error);
    throw error;
  }
}

async function handleHymnDataRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Updated hymn data from network:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, serving hymn data from cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATES') {
    checkForUpdates().then((hasUpdates) => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ hasUpdates });
      }
    }).catch((error) => {
      console.error('[SW] Error checking updates:', error);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ hasUpdates: false, error: true });
      }
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    }).catch((error) => {
      console.error('[SW] Error clearing caches:', error);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: true });
      }
    });
  }
});

async function checkForUpdates() {
  try {
    const hymnFiles = [
      '/data/hymns/campanha.json',
      '/data/hymns/comissao.json',
      '/data/hymns/conjunto-musical.json',
      '/data/hymns/coral.json',
      '/data/hymns/criancas.json',
      '/data/hymns/grupo-jovem.json',
      '/data/hymns/proat.json',
      '/data/hymns/uniao-adolescentes.json'
    ];
    
    const cache = await caches.open(STATIC_CACHE);
    let hasUpdates = false;
    
    for (const file of hymnFiles) {
      try {
        const cachedResponse = await cache.match(file);
        const networkResponse = await fetch(file);
        
        if (!networkResponse.ok) {
          continue;
        }
        
        if (!cachedResponse) {
          await cache.put(file, networkResponse.clone());
          hasUpdates = true;
          console.log(`[SW] New hymn file added: ${file}`);
          continue;
        }
        
        const cachedText = await cachedResponse.text();
        const networkText = await networkResponse.clone().text();
        
        if (cachedText !== networkText) {
          await cache.put(file, networkResponse.clone());
          hasUpdates = true;
          console.log(`[SW] Updated hymn file: ${file}`);
        }
      } catch (error) {
        console.error(`[SW] Error checking ${file}:`, error);
      }
    }
    
    if (hasUpdates) {
      const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      clients.forEach(client => {
        client.postMessage({ type: 'HYMNS_UPDATED' });
      });
    }
    
    console.log(`[SW] Update check complete. Has updates: ${hasUpdates}`);
    return hasUpdates;
  } catch (error) {
    console.error('[SW] Error checking for updates:', error);
    return false;
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}
