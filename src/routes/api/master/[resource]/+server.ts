/**
 * Master dari tabel lama (hak menu dicek di server):
 * GET → daftar · POST → tambah · PUT {id, values} → ubah · PATCH {ids, active} → aktif/nonaktif · DELETE ?id= → hapus
 */
import { json } from '@sveltejs/kit';
import { create, list, remove, setActive, update } from '#lib/server/master/service.ts';
import { body, clientIp, handle } from '#lib/server/http.ts';

export const GET = (event) => handle(async () => json({ rows: await list(event.params.resource, event.locals.user!) }));

export const POST = (event) =>
	handle(async () => {
		const row = await create(event.params.resource, event.locals.user!, await body(event), clientIp(event));
		return json({ row }, { status: 201 });
	});

export const PUT = (event) =>
	handle(async () => {
		const b = await body(event);
		const values = b.values && typeof b.values === 'object' ? (b.values as Record<string, unknown>) : {};
		return json({ row: await update(event.params.resource, event.locals.user!, b.id, values, clientIp(event)) });
	});

export const PATCH = (event) =>
	handle(async () => {
		const b = await body(event);
		return json({ count: await setActive(event.params.resource, event.locals.user!, b.ids, b.active === true, clientIp(event)) });
	});

export const DELETE = (event) =>
	handle(async () => {
		await remove(event.params.resource, event.locals.user!, event.url.searchParams.get('id'), clientIp(event));
		return json({ ok: true });
	});
