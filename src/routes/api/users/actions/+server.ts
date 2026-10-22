/** POST /api/users/actions {action: 'activate' | 'deactivate' | 'reset-password', ids} (admin) */
import { json } from '@sveltejs/kit';
import { AuthError, resetPasswords, setActive } from '#lib/server/auth/users.ts';
import { body, clientIp, handle, requireAdmin } from '#lib/server/http.ts';

export const POST = (event) =>
	handle(async () => {
		const admin = requireAdmin(event);
		const b = await body(event);
		const ip = clientIp(event);
		switch (b.action) {
			case 'activate':
			case 'deactivate':
				return json({ count: await setActive(b.ids, b.action === 'activate', admin, ip) });
			case 'reset-password':
				// password sementara hanya dikirim sekali di respons ini; di database yang tersimpan hash-nya
				return json({ passwords: await resetPasswords(b.ids, admin, ip) });
			default:
				throw new AuthError('Aksi tidak dikenal');
		}
	});
