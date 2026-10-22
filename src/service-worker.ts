/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { self } from '$app/service-worker';
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';

const CACHE = `senja-${version}`;
const SHELL = '/'; // SPA shell untuk navigasi offline
const PRECACHE = [...immutable.map((f) => '/' + f.path.replace(/^\//, '')), ...assets.map((f) => '/' + f.path.replace(/^\//, '')), SHELL];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((c) => c.addAll(PRECACHE))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== location.origin) return;

	// navigasi halaman: network-first, fallback ke shell (offline)
	if (req.mode === 'navigate') {
		event.respondWith(
			fetch(req)
				.then((res) => {
					const copy = res.clone();
					caches.open(CACHE).then((c) => c.put(SHELL, copy));
					return res;
				})
				.catch(async () => (await caches.match(SHELL)) ?? Response.error())
		);
		return;
	}

	// aset build & static: cache-first
	event.respondWith(
		caches.match(req).then(
			(hit) =>
				hit ??
				fetch(req).then((res) => {
					if (res.ok && (url.pathname.startsWith('/_app/') || PRECACHE.includes(url.pathname))) {
						const copy = res.clone();
						caches.open(CACHE).then((c) => c.put(req, copy));
					}
					return res;
				})
		)
	);
});
