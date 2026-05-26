const CACHE = "eduka-student-v32.3.0";
const APP_SHELL = "/student-app/home?v=3230";
const ASSETS = [
  APP_SHELL,
  "/student-app.css?v=32.3.0",
  "/student-app.js?v=32.3.0",
  "/assets/logo_icon.webp"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS).catch(() => null)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE && /^eduka-student-v/i.test(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const isStudentRoute = url.pathname === "/student-app" || url.pathname.startsWith("/student-app/");
  const isStudentAsset = url.pathname === "/student-app.css" || url.pathname === "/student-app.js";
  const isSharedAsset = url.pathname.startsWith("/assets/");

  if (!isStudentRoute && !isStudentAsset && !isSharedAsset) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => null);
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(APP_SHELL)))
  );
});
