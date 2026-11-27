/** GET /api/produk-foto → jumlah foto per kode model { counts: { [model_id]: n } } (kolom Foto di grid Produk) */
import { json } from '@sveltejs/kit';
import { handle } from '#lib/server/http.ts';
import { countFoto } from '#lib/server/produk-foto.ts';

export const GET = (event) => handle(async () => json({ counts: await countFoto(event.locals.user!) }));
