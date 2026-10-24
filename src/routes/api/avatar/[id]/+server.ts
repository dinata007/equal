/** GET /api/avatar/{id}?v={versi} → foto profil pengguna (semua pengguna yang login boleh melihat) */
import { error } from '@sveltejs/kit';
import { readAvatar } from '#lib/server/auth/profile.ts';

export const GET = async ({ params, url }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(404);
	const a = await readAvatar(id);
	if (!a) error(404);
	return new Response(new Uint8Array(a.data), {
		headers: {
			'Content-Type': a.type,
			// URL memuat versi → isi untuk versi itu tidak pernah berubah
			'Cache-Control': url.searchParams.get('v') === String(a.ver) ? 'private, max-age=31536000, immutable' : 'private, no-cache',
			'Content-Security-Policy': "default-src 'none'; sandbox"
		}
	});
};
