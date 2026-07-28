const CACHE = 'story-studio-v1'
const STATIC = ['/manifest.json', '/icon.svg', '/logotipovar.jpg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(STATIC.map((a) => c.add(a).catch(() => {})))
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

self.addEventListener('fetch', (e) => {
  const { pathname } = new URL(e.request.url)
  if (STATIC.includes(pathname)) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)))
    return
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')))
  }
})
