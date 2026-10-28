/** GET /api/pembelian?from=yyyy-mm-dd&to=yyyy-mm-dd[&fresh=1] → penerimaan barang per hari & kategori (hanya baca; hak menu & brand dicek di server) */
import { json } from '@sveltejs/kit';
import { pembelian } from '#lib/server/pembelian.ts';
import { handle } from '#lib/server/http.ts';

export const GET = (event) => handle(async () => {
	const q = event.url.searchParams;
	return json(await pembelian(event.locals.user!, q.get('from'), q.get('to'), q.has('fresh')));
});
