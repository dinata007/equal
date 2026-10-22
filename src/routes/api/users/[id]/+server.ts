/** PUT /api/users/:id → ubah data pengguna, hak akses menu & brand (admin) */
import { json } from '@sveltejs/kit';
import { AuthError, updateUser } from '#lib/server/auth/users.ts';
import { body, clientIp, handle, requireAdmin } from '#lib/server/http.ts';

export const PUT = (event) =>
	handle(async () => {
		const admin = requireAdmin(event);
		const id = Number(event.params.id);
		if (!Number.isInteger(id) || id <= 0) throw new AuthError('Pengguna tidak ditemukan', 404);
		await updateUser(id, await body(event), admin, clientIp(event));
		return json({ ok: true });
	});
