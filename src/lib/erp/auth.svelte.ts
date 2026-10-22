/**
 * Sesi login di sisi browser. Sumber kebenarannya server: cookie httpOnly + web.sessions,
 * dan hak akses juga dicek di server untuk setiap endpoint /api.
 *
 * Model akses: admin = akses penuh; pengguna lain diatur menu on/off (menu aktif = semua aksi).
 * Menu khusus admin (adminOnly) hanya terbuka untuk admin.
 */
import { invalidateAll } from '$app/navigation';
import { api, ApiError, setUnauthorizedHandler } from './api';
import { GRANTABLE, LEAVES, isAdminOnly } from './menu';
import type { Action, SessionUser } from './types';

export const accessLabel = (u: { admin: boolean; menus: string[] } | null | undefined) =>
	!u ? '' : u.admin ? 'Admin · akses penuh' : `${u.menus.length} menu`;

/** menu aktif seorang pengguna (admin: semua menu yang bisa diatur) */
export const menusOf = (u: { admin: boolean; menus: string[] }) => (u.admin ? GRANTABLE.map((l) => l.path) : u.menus);

export interface AuthData {
	user: SessionUser | null;
	dbReady: boolean;
	dbError: string | null;
}

class Auth {
	user = $state<SessionUser | null>(null);
	dbReady = $state(false);
	dbError = $state<string | null>(null);
	admin = $derived(!!this.user?.admin);
	accessLabel = $derived(accessLabel(this.user));
	#menus = $derived(new Set(this.user?.menus ?? []));

	constructor() {
		setUnauthorizedHandler(() => (this.user = null));
	}

	/** data sesi dari server (src/routes/+layout.server.ts) */
	set(data: AuthData) {
		this.user = data.user;
		this.dbReady = data.dbReady;
		this.dbError = data.dbError;
	}

	/** null bila berhasil, atau pesan error */
	async login(username: string, password: string): Promise<string | null> {
		try {
			await api('/api/auth/login', { body: { username, password } });
			await invalidateAll();
			return null;
		} catch (e) {
			return e instanceof ApiError ? e.message : 'Gagal login';
		}
	}

	async logout() {
		await api('/api/auth/logout', { body: {} }).catch(() => {});
		this.user = null;
		await invalidateAll();
	}

	/** null bila berhasil, atau pesan error */
	async changePassword(current: string, next: string): Promise<string | null> {
		try {
			await api('/api/auth/password', { body: { current, next } });
			await invalidateAll();
			return null;
		} catch (e) {
			return e instanceof ApiError ? e.message : 'Gagal mengganti password';
		}
	}

	can(path: string | undefined, _action: Action = 'view'): boolean {
		const u = this.user;
		if (!u || !path || u.mustChange) return false;
		if (u.admin) return true;
		return !isAdminOnly(path) && this.#menus.has(path);
	}

	/** Bisa membuka minimal satu menu di bawah prefix (untuk modul/grup) */
	canAny(prefix: string) {
		return LEAVES.some((l) => l.path.startsWith(prefix + '/') && this.can(l.path));
	}
}

export const auth = new Auth();
