/** GET /api/stok?from=yyyy-mm-dd&to=yyyy-mm-dd[&fresh=1] → posisi stok toko Dashboard (hanya baca; hak menu & brand dicek di server) */
import { json } from '@sveltejs/kit';
import { stok } from '#lib/server/stok.ts';
import { handle } from '#lib/server/http.ts';

export const GET = (event) => handle(async () => {
	const q = event.url.searchParams;
	return json(await stok(event.locals.user!, q.get('from'), q.get('to'), q.has('fresh')));
});
