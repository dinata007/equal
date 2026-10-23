/** GET /api/lookup/:name → pilihan kode & nama untuk isian form (semua pengguna login; disaring cakupan brand) */
import { json } from '@sveltejs/kit';
import { lookup } from '#lib/server/master/service.ts';
import { handle } from '#lib/server/http.ts';

export const GET = (event) => handle(async () => json({ options: await lookup(event.params.name, event.locals.user!) }));
