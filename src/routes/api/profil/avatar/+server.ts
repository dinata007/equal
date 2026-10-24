/** PUT /api/profil/avatar (isi = gambar) → ganti foto · DELETE → hapus foto */
import { json } from '@sveltejs/kit';
import { AVATAR_MAX_BYTES, removeAvatar, saveAvatar } from '#lib/server/auth/profile.ts';
import { AuthError } from '#lib/server/auth/users.ts';
import { clientIp, handle } from '#lib/server/http.ts';

export const PUT = (event) =>
	handle(async () => {
		const u = event.locals.user!;
		if (Number(event.request.headers.get('content-length') ?? 0) > AVATAR_MAX_BYTES) throw new AuthError('Ukuran foto maksimal 512 KB', 413);
		const bytes = new Uint8Array(await event.request.arrayBuffer());
		return json({ avatar: await saveAvatar(u.id, u.username, bytes, clientIp(event)) });
	});

export const DELETE = (event) =>
	handle(async () => {
		const u = event.locals.user!;
		await removeAvatar(u.id, u.username, clientIp(event));
		return json({ avatar: null });
	});
