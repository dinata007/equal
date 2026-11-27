/** GET /api/produk-foto/{model} → daftar foto · POST (isi = gambar) → tambah foto, balas daftar terbaru */
import { json } from '@sveltejs/kit';
import { AuthError } from '#lib/server/auth/users.ts';
import { clientIp, handle } from '#lib/server/http.ts';
import { FOTO_MAX_BYTES, addFoto, listFoto } from '#lib/server/produk-foto.ts';

export const GET = (event) => handle(async () => json({ fotos: await listFoto(event.locals.user!, event.params.model) }));

export const POST = (event) =>
	handle(async () => {
		if (Number(event.request.headers.get('content-length') ?? 0) > FOTO_MAX_BYTES) throw new AuthError('Ukuran foto maksimal 3 MB', 413);
		const bytes = new Uint8Array(await event.request.arrayBuffer());
		return json({ fotos: await addFoto(event.locals.user!, event.params.model, bytes, clientIp(event)) }, { status: 201 });
	});
