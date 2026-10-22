/** POST /api/auth/password {current, next} → ganti password sendiri */
import { json } from '@sveltejs/kit';
import { changePassword } from '#lib/server/auth/users.ts';
import { body, clientIp, handle } from '#lib/server/http.ts';

export const POST = (event) =>
	handle(async () => {
		const b = await body(event);
		await changePassword(event.locals.user!, event.locals.sessionId!, String(b.current ?? ''), String(b.next ?? ''), clientIp(event));
		return json({ ok: true });
	});
