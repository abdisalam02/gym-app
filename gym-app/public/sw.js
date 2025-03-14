// Service Worker Version
const CACHE_NAME = 'gymtrack-cache-v1';

// Resources to cache initially
const INITIAL_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files
  // These will depend on your actual built app structure
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline resources');
      return cache.addAll(INITIAL_CACHE);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Immediately take control of all open clients
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  console.log('[ServiceWorker] Fetch', event.request.url);
  
  // For API requests, use network first, then cache
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase.co')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // For everything else, use cache first, falling back to network
  event.respondWith(cacheFirstStrategy(event.request));
});

// Cache-first strategy: try cache, fallback to network and update cache
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Even if we found a response in the cache, we still make a network request
    // to update the cache for next time - but we don't wait for it
    fetch(request).then((networkResponse) => {
      if (networkResponse) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      }
    }).catch(() => {
      // Network error, but we already have a cached response so no problem
    });
    
    return cachedResponse;
  }
  
  // Not in cache, so get from network
  try {
    const networkResponse = await fetch(request);
    
    // Only cache valid responses
    if (networkResponse && networkResponse.status === 200) {
      const cacheResponse = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, cacheResponse);
      });
    }
    
    return networkResponse;
  } catch (error) {
    // Network error and no cache
    // Return a custom offline page for HTML requests
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    // For other requests, just return an error response
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Network-first strategy: try network, fallback to cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache GET requests with 200 status
    if (request.method === 'GET' && networkResponse.status === 200) {
      const cacheResponse = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, cacheResponse);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, trying cache', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No network, no cache
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
} 