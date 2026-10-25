/** GET /api/dashboard/:sumber?set=sales[&fresh=1] → data Dashboard 2 (hanya baca; hak menu dicek di server) */
import { json } from '@sveltejs/kit';
import { dashboardData } from '#lib/server/dashboard.ts';
import { handle } from '#lib/server/http.ts';

export const GET = (event) =>
	handle(async () =>
		json(await dashboardData(event.locals.user!, event.params.sumber, event.url.searchParams.get('set') ?? '', event.url.searchParams.has('fresh')))
	);
