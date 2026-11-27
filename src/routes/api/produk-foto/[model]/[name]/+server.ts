/** GET /api/produk-foto/{model}/{file} → isi foto (file `utama` = foto pertama) · DELETE → hapus foto, balas daftar terbaru */
import { json } from '@sveltejs/kit';
import { clientIp, handle } from '#lib/server/http.ts';
import { readCover, readFoto, removeFoto } from '#lib/server/produk-foto.ts';

export const GET = (event) =>
	handle(async () => {
		const cover = event.params.name === 'utama';
		const f = cover ? await readCover(event.locals.user!, event.params.model) : await readFoto(event.locals.user!, event.params.model, event.params.name);
		return new Response(new Uint8Array(f.data), {
			headers: {
				'Content-Type': f.type,
				// nama file unik per unggahan → isinya tidak pernah berubah; foto utama bisa berganti
				'Cache-Control': cover ? 'private, max-age=300' : 'private, max-age=31536000, immutable',
				'Content-Security-Policy': "default-src 'none'; sandbox",
				'X-Content-Type-Options': 'nosniff'
			}
		});
	});

export const DELETE = (event) =>
	handle(async () => json({ fotos: await removeFoto(event.locals.user!, event.params.model, event.params.name, clientIp(event)) }));
