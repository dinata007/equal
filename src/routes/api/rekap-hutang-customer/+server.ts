/** GET /api/rekap-hutang-customer[?detail=1] → rekap piutang customer dari DataWindow PB w_02b_04 */
import { json } from '@sveltejs/kit';
import { rekapHutangCustomer } from '#lib/server/rekap-hutang-customer.ts';
import { handle } from '#lib/server/http.ts';

export const GET = (event) => handle(async () =>
	json(await rekapHutangCustomer(event.locals.user!, event.url.searchParams.has('detail')))
);
