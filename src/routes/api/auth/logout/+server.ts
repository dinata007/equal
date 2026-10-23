/** POST /api/auth/logout → hapus sesi di server & cookie */
import { json } from '@sveltejs/kit';
import { audit } from '#lib/server/auth/audit.ts';
import { deleteSession, SESSION_COOKIE } from '#lib/server/auth/session.ts';
import { clientIp, handle } from '#lib/server/http.ts';

export const POST = (event) =>
	handle(async () => {
		const { user, sessionId } = event.locals;
		if (sessionId) await deleteSession(sessionId);
		event.cookies.delete(SESSION_COOKIE, { path: '/' });
		if (user) await audit('logout', { userId: user.id, username: user.username, ip: clientIp(event) });
		return json({ ok: true });
	});
