import { json } from '@sveltejs/kit';
import { body, handle } from '#lib/server/http.ts';
import { tokoPenjualan } from '#lib/server/toko-penjualan.ts';
import { createTokoPenjualan, deleteTokoPenjualan, editTokoPenjualan, tokoPenjualanOptions, tokoPenjualanProduct } from '#lib/server/toko-penjualan-write.ts';
import { AuthError } from '#lib/server/auth/users.ts';

export const GET = (event) => handle(async () => {
	const q = event.url.searchParams;
	if (q.has('options')) return json(await tokoPenjualanOptions(event.locals.user!, q.get('store')));
	if (q.has('product')) return json(await tokoPenjualanProduct(event.locals.user!, q.get('store'), q.get('customer'), q.get('product')));
	return json(await tokoPenjualan(event.locals.user!, q.get('from'), q.get('to'), q.get('store'), q.get('payment')));
});

export const POST = (event) => handle(async () => json(await createTokoPenjualan(event.locals.user!, await body(event)), { status: 201 }));

export const PUT = (event) => handle(async () => {
	const input = await body(event);
	const documentId = typeof input.documentId === 'string' ? input.documentId : '';
	if (!documentId) throw new AuthError('documentId harus diisi');
	return json(await editTokoPenjualan(event.locals.user!, documentId, input));
});

export const DELETE = (event) => handle(async () => {
	const q = event.url.searchParams;
	const documentId = q.get('documentId') ?? '';
	const store = q.get('store');
	await deleteTokoPenjualan(event.locals.user!, store, documentId);
	return json({ ok: true });
});
