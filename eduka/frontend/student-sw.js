const CACHE="eduka-student-v24.1.0";
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/student-app.css?v=24.1.0","/student-app.js?v=24.1.0"]).catch(()=>null)));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.pathname.startsWith("/api/"))return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match("/student-app.css?v=24.1.0"))));});
