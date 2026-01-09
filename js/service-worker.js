$serviceWorker = @'
const CACHE_NAME = 'braxon-app-v1';
const urlsToCache = [
  '/',
  '/mobile-login.html',
  '/mobile-home.html',
  '/daily-report-form.html',
  '/photo-documentation.html',
  '/module-detail.html',
  '/mobile-project-card.html',
  '/project-details.html',
  '/site-module-entry.html',
  '/css/styles.css',
  '/css/mobile-modern.css',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/dashboard-map.js',
  '/js/mobile-app.js'
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app files');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-daily-reports') {
    event.waitUntil(syncDailyReports());
  }
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos());
  }
});

async function syncDailyReports() {
  console.log('🔄 Syncing daily reports...');
  // Will implement this in Step 6
}

async function syncPhotos() {
  console.log('🔄 Syncing photos...');
  // Will implement this in Step 6
}
'@

$serviceWorker | Out-File -FilePath "service-worker.js" -Encoding UTF8
Write-Host "✅ Service worker created" -ForegroundColor Green