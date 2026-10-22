/**
 * Otorisasi prototipe. Pada tahap DB: password di-hash (argon2/bcrypt) di server,
 * sesi via cookie httpOnly di hooks.server.ts, dan `can()` juga dicek di server.
 *
 * Model akses: admin = akses penuh; user lain diatur menu on/off.
 * Menu khusus admin (adminOnly) hanya terbuka untuk admin.
 * Menu aktif = boleh semua aksi.
 */
import { browser } from '$app/env';
import { db } from './db.svelte';
import { GRANTABLE, LEAVES, isAdminOnly } from './menu';
import type { Action, User } from './types';

const KEY = 'senja:session';

/** nilai kunci paling spesifik (path persis atau prefix modul/grup) */
export function menuOn(access: Record<string, boolean> | undefined, path: string): boolean {
	let best = false;
	let len = -1;
	for (const [k, v] of Object.entries(access ?? {})) {
		if ((path === k || path.startsWith(k + '/')) && k.length > len) {
			best = v;
			len = k.length;
		}
	}
	return best;
}

export function userOn(u: User | undefined, path: string) {
	if (!u) return false;
	if (u.admin) return true;
	return !isAdminOnly(path) && menuOn(u.access, path);
}
export const menuCount = (u: User) => GRANTABLE.filter((l) => userOn(u, l.path)).length;
export const accessLabel = (u: User | undefined) =>
	!u ? '' : (u.admin ? 'Admin · akses penuh' : `${menuCount(u)} menu`);

class Auth {
	userId = $state<string | null>(null);
	// akun yang dinonaktifkan/dihapus langsung kehilangan sesinya
	user = $derived.by(() => {
		const u = db.get<User>('users', this.userId);
		return u?.active ? u : undefined;
	});
	admin = $derived(!!this.user?.admin);
	accessLabel = $derived(accessLabel(this.user));

	init() {
		if (browser) this.userId = localStorage.getItem(KEY);
	}

	login(username: string, password: string): string | null {
		const u = db
			.all<User>('users')
			.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
		if (!u || u.password !== password) return 'Username atau password salah';
		if (!u.active) return 'Akun dinonaktifkan';
		this.userId = u.id;
		localStorage.setItem(KEY, u.id);
		return null;
	}

	logout() {
		this.userId = null;
		localStorage.removeItem(KEY);
	}

	can(path: string | undefined, _action: Action = 'view'): boolean {
		return !!path && userOn(this.user, path);
	}

	/** Bisa membuka minimal satu menu di bawah prefix (untuk modul/grup) */
	canAny(prefix: string) {
		return LEAVES.some((l) => l.path.startsWith(prefix + '/') && this.can(l.path));
	}
}

export const auth = new Auth();
