"use strict";

const cachePrefix = "happy-furniture-portfolio-";
const cacheName = cachePrefix + "offline1";
const root = self.registration.scope;
const files = [
  "./",
  "styles.css?v=offline1",
  "portfolio.js?v=offline1",
  "offline.js?v=offline1",
  "assets/particle-samples.js?v=offline1",
  "assets/particle-lightness.js?v=effectcraft",
  "assets/happy_furniture_ci_symbol_vector.svg?v=transparent",
  "assets/happy_furniture_wordmark_vector.svg?v=transparent",
  ...[
    "01-soopgyeol", "02-wood-christmas-tree", "03-wifi-sign",
    "04-dog-pendant", "05-sheep-pencil-holder", "06-zodiac-coaster",
  ].map(name => `assets/${name}.webp?v=effectcraft`),
].map(path => new URL(path, root).href);
const assets = new Set(files);
const pagePath = new URL(root).pathname;
const indexPath = new URL("index.html", root).pathname;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(files.map(url => new Request(url, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isPortfolio = request.mode === "navigate" && url.origin === self.location.origin &&
    (url.pathname === pagePath || url.pathname === indexPath);
  const key = isPortfolio ? root : request.url;
  if (!assets.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const response = await cache.match(key);
    return response ?? fetch(request);
  })());
});
