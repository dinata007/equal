/**
 * Setiap permintaan: baca sesi dari cookie, jaga endpoint /api (wajib login, cek asal permintaan),
 * dan pasang header keamanan dasar.
 */
import { json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { dbConfigured } from '#lib/server/db.ts';
import { readSession, SESSION_COOKIE } from '#lib/server/auth/session.ts';
import { sessionUser } from '#lib/server/auth/users.ts';

/** boleh diakses tanpa login */
const PUBLIC_API = new Set(['/api/health', '/api/auth/login']);
/** boleh diakses saat pengguna masih wajib ganti password */
const MUST_CHANGE_API = new Set(['/api/auth/password', '/api/auth/logout']);

export const handle: Handle = async ({ event, resolve }) => {
	const { url, request, cookies } = event;
	const isApi = url.pathname.startsWith('/api/');
	event.locals.user = null;
	event.locals.sessionId = null;
	event.locals.dbReady = dbConfigured();
	event.locals.dbError = null;

	// permintaan pengubah data hanya dari halaman aplikasi ini sendiri (lapisan tambahan selain SameSite cookie)
	if (isApi && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
		const origin = request.headers.get('origin');
		if (origin && origin !== url.origin) return json({ error: 'Permintaan ditolak' }, { status: 403 });
	}

	const token = cookies.get(SESSION_COOKIE);
	if (token && event.locals.dbReady) {
		try {
			const s = await readSession(token);
			if (s) {
				event.locals.user = await sessionUser(s);
				event.locals.sessionId = s.sessionId;
			} else cookies.delete(SESSION_COOKIE, { path: '/' });
		} catch (e) {
			console.error('[auth] gagal membaca sesi:', e);
			event.locals.dbError = 'Database tidak dapat dihubungi';
		}
	}

	if (isApi && !PUBLIC_API.has(url.pathname)) {
		if (event.locals.dbError) return json({ error: event.locals.dbError }, { status: 503 });
		if (!event.locals.user) return json({ error: 'Sesi berakhir, silakan login lagi' }, { status: 401 });
		if (event.locals.user.mustChange && !MUST_CHANGE_API.has(url.pathname)) return json({ error: 'Ganti password terlebih dahulu' }, { status: 403 });
	}

	const res = await resolve(event);
	res.headers.set('X-Content-Type-Options', 'nosniff');
	res.headers.set('X-Frame-Options', 'DENY');
	res.headers.set('Referrer-Policy', 'same-origin');
	// data API tidak di-cache, kecuali endpoint yang menentukan sendiri (mis. foto profil berversi)
	if (isApi && !res.headers.has('Cache-Control')) res.headers.set('Cache-Control', 'no-store');
	return res;
};
