/** DELETE /api/profil/sesi {ref} → keluarkan satu perangkat lain; {ref: '*'} → semua perangkat lain */
import { json } from '@sveltejs/kit';
import { revokeSessions } from '#lib/server/auth/profile.ts';
import { body, clientIp, handle } from '#lib/server/http.ts';

export const DELETE = (event) =>
	handle(async () => {
		const u = event.locals.user!;
		const b = await body(event);
		return json({ revoked: await revokeSessions(u.id, u.username, event.locals.sessionId!, String(b.ref ?? ''), clientIp(event)) });
	});
