const CACHE = 'story-studio-v1'
const ASSETS = ['/', '/manifest.json', '/icon.svg', '/logotipovar.jpg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => {
      return Promise.allSettled(ASSETS.map((a) => c.add(a).catch(() => {})))
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

self.addEventListener('fetch', (e) => {
  const { pathname } = new URL(e.request.url)
  if (ASSETS.includes(pathname)) {
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request))
    )
  }
})
