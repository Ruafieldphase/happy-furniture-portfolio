"use strict";

const CACHE_PREFIX = "happy-furniture-";
const CACHE_NAME = "happy-furniture-portfolio-offline-v5";
const ROOT = self.registration.scope;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./portfolio.js",
  "./offline.js",
  "./manifest.webmanifest",
  "./assets/particle-samples.js",
  "./assets/particle-lightness.js",
  "./assets/happy_furniture_ci_symbol_vector.svg",
  "./assets/happy_furniture_wordmark_vector.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/01-soopgyeol.webp",
  "./assets/02-wood-christmas-tree.webp",
  "./assets/03-wifi-sign.webp",
  "./assets/04-dog-pendant.webp",
  "./assets/05-sheep-pencil-holder.webp",
  "./assets/06-zodiac-coaster.webp",
].map((path) => new URL(path, ROOT).href);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS.map((url) => new Request(url, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/workshop-offline.html")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached =
        (await cache.match(new URL("./index.html", ROOT).href, { ignoreSearch: true })) ||
        (await cache.match(ROOT, { ignoreSearch: true }));
      if (cached) return cached;
      return fetch(request);
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok && url.pathname.startsWith(new URL(ROOT).pathname)) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      return new Response("", { status: 503, statusText: "Offline" });
    }
  })());
});
