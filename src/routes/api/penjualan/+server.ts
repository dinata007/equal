/** GET /api/penjualan?from=yyyy-mm-dd&to=yyyy-mm-dd[&fresh=1] → data penjualan Dashboard (hanya baca; hak menu & brand dicek di server) */
import { json } from '@sveltejs/kit';
import { penjualan } from '#lib/server/penjualan.ts';
import { handle } from '#lib/server/http.ts';

export const GET = (event) => handle(async () => {
	const q = event.url.searchParams;
	return json(await penjualan(event.locals.user!, q.get('from'), q.get('to'), q.has('fresh')));
});
