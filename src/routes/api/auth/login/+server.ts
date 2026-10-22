/** POST /api/auth/login {username, password} → set cookie sesi */
import { json } from '@sveltejs/kit';
import { ABSOLUTE_DAYS, SESSION_COOKIE } from '#lib/server/auth/session.ts';
import { AuthError, login } from '#lib/server/auth/users.ts';
import { body, clientIp, handle } from '#lib/server/http.ts';

export const POST = (event) =>
	handle(async () => {
		if (!event.locals.dbReady) throw new AuthError('Database belum dikonfigurasi (.env)', 503);
		const b = await body(event);
		const token = await login(String(b.username ?? ''), String(b.password ?? ''), clientIp(event), event.request.headers.get('user-agent'));
		event.cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			// http di jaringan lokal tetap bisa login; di https cookie hanya dikirim lewat koneksi aman
			secure: event.url.protocol === 'https:',
			maxAge: ABSOLUTE_DAYS * 86_400
		});
		return json({ ok: true });
	});
