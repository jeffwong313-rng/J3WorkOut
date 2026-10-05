/* J3 WorkOut — service worker
   Makes the app installable and lets it open without internet (e.g. a gym with no signal).
   Strategy: network first, fall back to the saved copy. When you're online you always get
   the newest version; when you're offline you get the last version you opened.
   Bump CACHE when the list of files changes. */
const CACHE = 'j3workout-v1';
const FILES = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png',
  './js/data.js', './js/state.js', './js/app.js', './js/tools.js', './js/settings.js', './js/coach.js', './js/learn.js',
  './js/freestyle.js', './js/vacation.js', './js/muscledb.js', './js/workout-ux.js', './js/progress.js', './js/smartplan.js',
  './js/daily.js', './js/polish.js', './js/pwa.js', './js/main.js'
];

self.addEventListener('install', event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', event=>{
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;          // never touch other sites
  if(url.pathname.includes('/tests/')) return;         // tests always load fresh
  event.respondWith(
    fetch(req).then(res=>{
      if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); }
      return res;
    }).catch(()=> caches.match(req, { ignoreSearch: true }).then(hit=> hit || caches.match('./index.html')))
  );
});
