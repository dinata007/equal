/** Kontrak pegawai: GET → riwayat · POST {tipe, tgl, tgl_awal, tgl_akhir, …} → kontrak baru · DELETE ?kontrak= → hapus */
import { json } from '@sveltejs/kit';
import { add, list, remove } from '#lib/server/master/kontrak.ts';
import { body, clientIp, handle } from '#lib/server/http.ts';

export const GET = (event) => handle(async () => json(await list(event.locals.user!, event.params.id)));

export const POST = (event) => handle(async () => json(await add(event.locals.user!, event.params.id, await body(event), clientIp(event))));

export const DELETE = (event) =>
	handle(async () => json(await remove(event.locals.user!, event.params.id, event.url.searchParams.get('kontrak') ?? '', clientIp(event))));
