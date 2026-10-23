/** Proses artikel model produk: GET → warna, size (+harga) & artikel yang ada · POST {warna, sizes} → buat artikel baru */
import { json } from '@sveltejs/kit';
import { palette, process } from '#lib/server/master/artikel.ts';
import { body, clientIp, handle } from '#lib/server/http.ts';

export const GET = (event) => handle(async () => json(await palette(event.locals.user!, event.params.model)));

export const POST = (event) => handle(async () => json(await process(event.locals.user!, event.params.model, await body(event), clientIp(event))));
