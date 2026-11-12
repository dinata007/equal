import { json } from '@sveltejs/kit';
import { handle } from '#lib/server/http.ts';
import { tokoStockCard, tokoStockMutation, tokoStockProducts } from '#lib/server/toko-stock-report.ts';

export const GET = (event) => handle(async () => {
	const q = event.url.searchParams;
	const user = event.locals.user!;
	switch (q.get('mode')) {
		case 'mutation':
			return json(await tokoStockMutation(user, q.get('from'), q.get('to'), q.get('store'), q.get('moving') === '1'));
		case 'card':
			return json(await tokoStockCard(user, q.get('item'), q.get('from'), q.get('to'), q.get('store')));
		case 'products':
			return json({ items: await tokoStockProducts(user, q.get('q')) });
		default:
			return json({ error: 'Mode laporan stok tidak valid' }, { status: 400 });
	}
});
