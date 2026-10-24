/**
 * Pengguna web: login, hak akses, ganti password, dan pengelolaan oleh admin.
 * Semua validasi dilakukan di server — data dari browser tidak dipercaya.
 */
import { GRANTABLE, isGrantable } from '#lib/erp/menu.ts';
import { cleanPrefs } from '#lib/erp/prefs.ts';
import type { ManagedUser, SessionUser } from '#lib/erp/types.ts';
import { getPool, request, sql, utcIso } from '../db.ts';
import { audit } from './audit.ts';
import { generatePassword, hashPassword, passwordProblem, verifyDummy, verifyPassword } from './password.js';
import { createSession, deleteUserSessions, purgeExpiredSessions, type SessionRow } from './session.ts';

/** gagal login berturut-turut sebelum akun dikunci sementara */
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
/** batas login GAGAL per alamat IP (melindungi dari tebak password massal ke banyak akun).
 *  Login yang berhasil tidak dihitung, agar banyak karyawan di balik satu IP kantor tidak ikut terblokir. */
const IP_LIMIT = 50;
const IP_WINDOW_MS = 15 * 60_000;
const ipHits = new Map<string, { n: number; until: number }>();

export const USERNAME_RE = /^[A-Za-z0-9._-]{3,30}$/;
const GENERIC = 'Username atau password salah';

export class AuthError extends Error {
	constructor(
		message: string,
		public status = 400
	) {
		super(message);
	}
}

/* ---------------- hak akses (menu on/off) & cakupan brand ---------------- */
async function loadAccess(userIds: number[]) {
	const menus = new Map<number, string[]>();
	const brands = new Map<number, string[]>();
	if (!userIds.length) return { menus, brands };
	const ids = userIds.join(',');
	const r = await (await request()).query(`SELECT user_id, menu_path FROM dbo.AppUserMenu WHERE user_id IN (${ids});
		SELECT user_id, value FROM dbo.AppUserScope WHERE scope = 'brand' AND user_id IN (${ids});`);
	const [menuRows, scopeRows] = r.recordsets as unknown as [Record<string, any>[], Record<string, any>[]];
	// menu yang sudah tidak ada di aplikasi diabaikan
	for (const row of menuRows) if (isGrantable(row.menu_path)) menus.set(row.user_id, [...(menus.get(row.user_id) ?? []), row.menu_path]);
	for (const row of scopeRows) brands.set(row.user_id, [...(brands.get(row.user_id) ?? []), row.value]);
	return { menus, brands };
}

const parseJson = (s: string) => {
	try {
		return JSON.parse(s);
	} catch {
		return null;
	}
};

export async function sessionUser(s: SessionRow): Promise<SessionUser> {
	const { menus, brands } = await loadAccess([s.userId]);
	return {
		id: s.userId,
		username: s.username,
		name: s.name,
		admin: s.isAdmin,
		storeId: s.tokoId,
		mustChange: s.mustChange,
		menus: s.isAdmin ? [] : (menus.get(s.userId) ?? []),
		brands: s.isAdmin ? ['*'] : (brands.get(s.userId) ?? []),
		avatar: s.avatarVer,
		prefs: s.prefs ? cleanPrefs(parseJson(s.prefs)) : null
	};
}

/* ---------------- login ---------------- */
function ipBlocked(ip: string) {
	const h = ipHits.get(ip);
	return !!h && h.until > Date.now() && h.n >= IP_LIMIT;
}
function ipFailed(ip: string) {
	const now = Date.now();
	const h = ipHits.get(ip);
	if (!h || h.until < now) ipHits.set(ip, { n: 1, until: now + IP_WINDOW_MS });
	else h.n++;
	// bersihkan catatan lama sesekali agar tidak menumpuk di memori
	if (ipHits.size > 5000) for (const [k, v] of ipHits) if (v.until < now) ipHits.delete(k);
}

export async function login(username: string, password: string, ip: string, userAgent: string | null) {
	username = String(username ?? '').trim();
	password = String(password ?? '');
	if (!username || !password) throw new AuthError('Username dan password wajib diisi');
	if (ipBlocked(ip)) {
		await audit('login_ip_limit', { username, ip });
		throw new AuthError('Terlalu banyak percobaan login dari perangkat ini. Coba lagi dalam 15 menit.', 429);
	}
	const u = (
		await (await request())
			.input('u', sql.VarChar(30), username.slice(0, 30))
			.query(`SELECT id, username, password_hash, active, failed_attempts, locked_until,
				CASE WHEN locked_until > SYSUTCDATETIME() THEN DATEDIFF(SECOND, SYSUTCDATETIME(), locked_until) ELSE 0 END AS lockSecs
				FROM dbo.AppUser WHERE username = @u`)
	).recordset[0];

	if (!u || !u.password_hash) {
		ipFailed(ip);
		await verifyDummy(password);
		await audit('login_fail', { username, ip, detail: u ? 'belum punya password' : 'username tidak dikenal' });
		// pesan sama dengan password salah agar tidak membocorkan username mana yang ada
		throw new AuthError(GENERIC, 401);
	}
	if (u.lockSecs > 0) {
		ipFailed(ip);
		await verifyDummy(password);
		await audit('login_locked', { userId: u.id, username: u.username, ip });
		throw new AuthError(`Akun terkunci sementara karena terlalu banyak salah password. Coba lagi dalam ${Math.ceil(u.lockSecs / 60)} menit.`, 423);
	}
	if (!(await verifyPassword(password, u.password_hash))) {
		ipFailed(ip);
		const failed = u.failed_attempts + 1;
		const lock = failed >= MAX_FAILED;
		await (await request())
			.input('id', sql.Int, u.id)
			.input('f', sql.Int, lock ? 0 : failed)
			.query(`UPDATE dbo.AppUser SET failed_attempts = @f${lock ? `, locked_until = DATEADD(MINUTE, ${LOCK_MINUTES}, SYSUTCDATETIME())` : ''} WHERE id = @id`);
		await audit(lock ? 'login_lock' : 'login_fail', { userId: u.id, username: u.username, ip, detail: `percobaan ke-${failed}` });
		throw new AuthError(lock ? `Terlalu banyak salah password. Akun dikunci ${LOCK_MINUTES} menit.` : GENERIC, 401);
	}
	if (!u.active) {
		await audit('login_inactive', { userId: u.id, username: u.username, ip });
		throw new AuthError('Akun dinonaktifkan. Hubungi admin.', 403);
	}
	await (await request())
		.input('id', sql.Int, u.id)
		.query('UPDATE dbo.AppUser SET failed_attempts = 0, locked_until = NULL, last_login_at = SYSUTCDATETIME() WHERE id = @id');
	if (Math.random() < 0.05) purgeExpiredSessions().catch(() => {});
	const token = await createSession(u.id, ip, userAgent);
	await audit('login_ok', { userId: u.id, username: u.username, ip });
	return token;
}

/* ---------------- ganti password sendiri ---------------- */
export async function changePassword(user: SessionUser, sessionId: string, current: string, next: string, ip: string) {
	const row = (await (await request()).input('id', sql.Int, user.id).query('SELECT password_hash FROM dbo.AppUser WHERE id = @id')).recordset[0];
	if (!row || !(await verifyPassword(String(current ?? ''), row.password_hash))) {
		await audit('password_change_fail', { userId: user.id, username: user.username, ip });
		throw new AuthError('Password saat ini salah', 400);
	}
	const problem = passwordProblem(String(next ?? ''), user.username);
	if (problem) throw new AuthError(problem);
	if (await verifyPassword(next, row.password_hash)) throw new AuthError('Password baru harus berbeda dari password lama');
	await (await request())
		.input('id', sql.Int, user.id)
		.input('h', sql.VarChar(255), await hashPassword(next))
		.query('UPDATE dbo.AppUser SET password_hash = @h, must_change_password = 0, password_changed_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME() WHERE id = @id');
	// sesi lain (perangkat lain) dicabut; sesi ini tetap
	await deleteUserSessions(user.id, sessionId);
	await audit('password_change', { userId: user.id, username: user.username, ip });
}

/* ---------------- pengelolaan pengguna (admin) ---------------- */
export async function listUsers(): Promise<ManagedUser[]> {
	const rows = (
		await (await request()).query(`SELECT u.id, u.username, u.name, u.is_admin, u.active, u.toko_id, u.legacy_user_id, u.must_change_password,
			CASE WHEN u.password_hash IS NULL THEN 0 ELSE 1 END AS has_password,
			CASE WHEN u.locked_until > SYSUTCDATETIME() THEN 1 ELSE 0 END AS locked, u.last_login_at,
			CASE WHEN p.avatar IS NULL THEN NULL ELSE p.avatar_ver END AS avatar_ver
			FROM dbo.AppUser u LEFT JOIN dbo.AppUserProfile p ON p.user_id = u.id ORDER BY u.name`)
	).recordset;
	const { menus, brands } = await loadAccess(rows.map((r) => r.id));
	return rows.map((r) => ({
		id: r.id,
		username: r.username,
		name: r.name,
		admin: !!r.is_admin,
		active: !!r.active,
		storeId: r.toko_id,
		menus: menus.get(r.id) ?? [],
		brands: brands.get(r.id) ?? [],
		hasPassword: !!r.has_password,
		mustChange: !!r.must_change_password,
		locked: !!r.locked,
		legacyId: r.legacy_user_id,
		lastLoginAt: utcIso(r.last_login_at),
		avatar: r.avatar_ver
	}));
}

export interface UserInput {
	username: string;
	name: string;
	admin: boolean;
	active: boolean;
	storeId: string | null;
	menus: string[];
	brands: string[];
}

/** hanya menu yang memang ada & boleh diatur (menu khusus admin tidak bisa diberikan) */
const cleanMenus = (menus: unknown) => (Array.isArray(menus) ? [...new Set(menus.map(String))].filter(isGrantable) : []);

async function validBrands(brands: unknown) {
	if (!Array.isArray(brands)) return [];
	if (brands.includes('*')) return ['*'];
	const known = new Set((await (await request()).query('SELECT brand_id FROM dbo.M_PRODUK_BRAND')).recordset.map((r) => String(r.brand_id).trim()));
	return [...new Set(brands.map(String))].filter((b) => known.has(b));
}

function cleanInput(raw: Record<string, unknown>): UserInput {
	const username = String(raw.username ?? '').trim();
	const name = String(raw.name ?? '').trim();
	if (!USERNAME_RE.test(username)) throw new AuthError('Username 3–30 karakter: huruf, angka, titik, minus, atau garis bawah');
	if (!name || name.length > 80) throw new AuthError('Nama wajib diisi (maksimal 80 karakter)');
	const storeId = raw.storeId ? String(raw.storeId).trim().slice(0, 10) : null;
	return { username, name, admin: raw.admin === true, active: raw.active !== false, storeId, menus: cleanMenus(raw.menus), brands: [] };
}

async function activeAdminCount(excludeId?: number) {
	return (await (await request()).input('ex', sql.Int, excludeId ?? 0).query('SELECT COUNT(*) AS n FROM dbo.AppUser WHERE is_admin = 1 AND active = 1 AND id <> @ex')).recordset[0].n as number;
}

/** simpan hak akses & brand dalam satu transaksi bersama data pengguna */
async function writeAccess(tx: InstanceType<typeof sql.Transaction>, userId: number, input: UserInput) {
	await new sql.Request(tx).input('uid', sql.Int, userId).query("DELETE FROM dbo.AppUserMenu WHERE user_id = @uid; DELETE FROM dbo.AppUserScope WHERE user_id = @uid AND scope = 'brand';");
	for (const path of input.admin ? [] : input.menus)
		await new sql.Request(tx).input('uid', sql.Int, userId).input('p', sql.VarChar(150), path).query('INSERT INTO dbo.AppUserMenu (user_id, menu_path) VALUES (@uid, @p)');
	for (const b of input.admin ? [] : input.brands)
		await new sql.Request(tx).input('uid', sql.Int, userId).input('b', sql.VarChar(20), b).query("INSERT INTO dbo.AppUserScope (user_id, scope, value) VALUES (@uid, 'brand', @b)");
}

export async function createUser(raw: Record<string, unknown>, by: SessionUser, ip: string) {
	const input = cleanInput(raw);
	input.brands = await validBrands(raw.brands);
	const tempPassword = generatePassword();
	const hash = await hashPassword(tempPassword);
	const tx = new sql.Transaction(await getPool());
	await tx.begin();
	try {
		const exists = (await new sql.Request(tx).input('u', sql.VarChar(30), input.username).query('SELECT 1 AS x FROM dbo.AppUser WITH (UPDLOCK, HOLDLOCK) WHERE username = @u')).recordset.length;
		if (exists) throw new AuthError(`Username "${input.username}" sudah dipakai`, 409);
		const id = (
			await new sql.Request(tx)
				.input('u', sql.VarChar(30), input.username)
				.input('n', sql.NVarChar(80), input.name)
				.input('h', sql.VarChar(255), hash)
				.input('a', sql.Bit, input.admin)
				.input('act', sql.Bit, input.active)
				.input('t', sql.VarChar(10), input.storeId)
				.input('by', sql.VarChar(30), by.username)
				.query(`INSERT INTO dbo.AppUser (username, name, password_hash, must_change_password, is_admin, active, toko_id, created_by)
					OUTPUT INSERTED.id VALUES (@u, @n, @h, 1, @a, @act, @t, @by)`)
		).recordset[0].id as number;
		await writeAccess(tx, id, input);
		await tx.commit();
		await audit('user_create', { userId: by.id, username: by.username, ip, detail: `${input.username}${input.admin ? ' (admin)' : ''}` });
		return { id, tempPassword };
	} catch (e) {
		await tx.rollback().catch(() => {});
		throw e;
	}
}

export async function updateUser(id: number, raw: Record<string, unknown>, by: SessionUser, ip: string) {
	const input = cleanInput(raw);
	input.brands = await validBrands(raw.brands);
	if (id === by.id && !input.admin) throw new AuthError('Flag admin tidak bisa dicabut dari akun Anda sendiri');
	if (id === by.id && !input.active) throw new AuthError('Akun yang sedang dipakai tidak bisa dinonaktifkan');
	if ((!input.admin || !input.active) && (await activeAdminCount(id)) === 0) throw new AuthError('Minimal harus ada satu admin aktif');
	const tx = new sql.Transaction(await getPool());
	await tx.begin();
	try {
		const dup = (await new sql.Request(tx).input('u', sql.VarChar(30), input.username).input('id', sql.Int, id).query('SELECT 1 AS x FROM dbo.AppUser WHERE username = @u AND id <> @id')).recordset.length;
		if (dup) throw new AuthError(`Username "${input.username}" sudah dipakai`, 409);
		const r = await new sql.Request(tx)
			.input('id', sql.Int, id)
			.input('u', sql.VarChar(30), input.username)
			.input('n', sql.NVarChar(80), input.name)
			.input('a', sql.Bit, input.admin)
			.input('act', sql.Bit, input.active)
			.input('t', sql.VarChar(10), input.storeId)
			.input('by', sql.VarChar(30), by.username)
			.query('UPDATE dbo.AppUser SET username = @u, name = @n, is_admin = @a, active = @act, toko_id = @t, updated_at = SYSUTCDATETIME(), updated_by = @by WHERE id = @id');
		if (!r.rowsAffected[0]) throw new AuthError('Pengguna tidak ditemukan', 404);
		await writeAccess(tx, id, input);
		await tx.commit();
	} catch (e) {
		await tx.rollback().catch(() => {});
		throw e;
	}
	if (!input.active) await deleteUserSessions(id);
	await audit('user_update', { userId: by.id, username: by.username, ip, detail: `${input.username}: ${input.admin ? 'admin' : input.menus.length + ' menu'}${input.active ? '' : ', nonaktif'}` });
}

const idList = (ids: unknown) => (Array.isArray(ids) ? [...new Set(ids.map(Number).filter((n) => Number.isInteger(n) && n > 0))] : []);

export async function setActive(rawIds: unknown, active: boolean, by: SessionUser, ip: string) {
	const ids = idList(rawIds);
	if (!ids.length) throw new AuthError('Tidak ada pengguna dipilih');
	if (!active && ids.includes(by.id)) throw new AuthError('Akun yang sedang dipakai tidak bisa dinonaktifkan');
	if (!active) {
		const left = (await (await request()).query(`SELECT COUNT(*) AS n FROM dbo.AppUser WHERE is_admin = 1 AND active = 1 AND id NOT IN (${ids.join(',')})`)).recordset[0].n;
		if (!left) throw new AuthError('Minimal harus ada satu admin aktif');
	}
	await (await request()).input('a', sql.Bit, active).input('by', sql.VarChar(30), by.username).query(`UPDATE dbo.AppUser SET active = @a, updated_at = SYSUTCDATETIME(), updated_by = @by WHERE id IN (${ids.join(',')})`);
	if (!active) for (const id of ids) await deleteUserSessions(id);
	await audit(active ? 'user_activate' : 'user_deactivate', { userId: by.id, username: by.username, ip, detail: `id ${ids.join(', ')}` });
	return ids.length;
}

/** Buat password sementara (ditampilkan sekali ke admin); pengguna wajib menggantinya saat login */
export async function resetPasswords(rawIds: unknown, by: SessionUser, ip: string) {
	const ids = idList(rawIds);
	if (!ids.length) throw new AuthError('Tidak ada pengguna dipilih');
	const users = (await (await request()).query(`SELECT id, username, name FROM dbo.AppUser WHERE id IN (${ids.join(',')})`)).recordset;
	const out: { id: number; username: string; name: string; password: string }[] = [];
	for (const u of users) {
		const password = generatePassword();
		await (await request())
			.input('id', sql.Int, u.id)
			.input('h', sql.VarChar(255), await hashPassword(password))
			.input('by', sql.VarChar(30), by.username)
			.query(`UPDATE dbo.AppUser SET password_hash = @h, must_change_password = 1, failed_attempts = 0, locked_until = NULL,
				password_changed_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME(), updated_by = @by WHERE id = @id`);
		await deleteUserSessions(u.id);
		out.push({ id: u.id, username: u.username, name: u.name, password });
	}
	await audit('password_reset', { userId: by.id, username: by.username, ip, detail: users.map((u) => u.username).join(', ') });
	return out;
}

/** Brand & toko untuk pilihan di form pengguna */
export async function lookups() {
	const r = await (await request()).query(`SELECT RTRIM(brand_id) AS id, nama AS name, CAST(ISNULL(flag_aktif, 0) AS bit) AS active FROM dbo.M_PRODUK_BRAND ORDER BY brand_id;
		SELECT RTRIM(toko_id) AS id, nama AS name, CAST(ISNULL(flag_aktif, 0) AS bit) AS active FROM dbo.M_TOKO ORDER BY nama;`);
	const [brands, stores] = r.recordsets as unknown as [{ id: string; name: string; active: boolean }[], { id: string; name: string; active: boolean }[]];
	return { brands, stores, grantable: GRANTABLE.length };
}
