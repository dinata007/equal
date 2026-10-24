/** GET /api/profil → sesi aktif & riwayat keamanan · PUT /api/profil {prefs} → simpan preferensi tampilan */
import { json } from '@sveltejs/kit';
import { savePrefs, security } from '#lib/server/auth/profile.ts';
import { body, handle } from '#lib/server/http.ts';

export const GET = (event) => handle(async () => json(await security(event.locals.user!.id, event.locals.sessionId!)));

export const PUT = (event) =>
	handle(async () => {
		const b = await body(event);
		return json({ prefs: await savePrefs(event.locals.user!.id, b.prefs) });
	});
