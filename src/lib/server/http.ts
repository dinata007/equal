/** Helper endpoint API: baca JSON, cek admin, ubah error menjadi respons JSON. */
import { json, type RequestEvent } from '@sveltejs/kit';
import { AuthError } from './auth/users.ts';

export async function body(event: RequestEvent): Promise<Record<string, unknown>> {
	try {
		const b = await event.request.json();
		return b && typeof b === 'object' ? b : {};
	} catch {
		throw new AuthError('Format permintaan tidak valid');
	}
}

export function requireAdmin(event: RequestEvent) {
	const u = event.locals.user;
	if (!u?.admin) throw new AuthError('Hanya admin yang boleh mengelola pengguna', 403);
	return u;
}

export const clientIp = (event: RequestEvent) => {
	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
};

/** jalankan handler; AuthError → pesan untuk pengguna, error lain → 500 tanpa detail internal */
export async function handle(fn: () => Promise<Response>) {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof AuthError) return json({ error: e.message }, { status: e.status });
		console.error('[api]', e);
		return json({ error: 'Terjadi kesalahan di server' }, { status: 500 });
	}
}
