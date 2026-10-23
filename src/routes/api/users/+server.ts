/** GET /api/users → daftar pengguna + pilihan brand & toko · POST /api/users → tambah pengguna (admin) */
import { json } from '@sveltejs/kit';
import { createUser, listUsers, lookups } from '#lib/server/auth/users.ts';
import { body, clientIp, handle, requireAdmin } from '#lib/server/http.ts';

export const GET = (event) =>
	handle(async () => {
		requireAdmin(event);
		const [users, opts] = await Promise.all([listUsers(), lookups()]);
		return json({ users, ...opts });
	});

export const POST = (event) =>
	handle(async () => {
		const admin = requireAdmin(event);
		const r = await createUser(await body(event), admin, clientIp(event));
		return json(r, { status: 201 });
	});
