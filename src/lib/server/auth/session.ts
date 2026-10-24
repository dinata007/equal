/**
 * Sesi login berbasis cookie httpOnly. Cookie berisi token acak 256-bit; yang disimpan di
 * database hanya hash SHA-256-nya, jadi kebocoran tabel sesi tidak bisa dipakai untuk login.
 */
import { createHash, randomBytes } from 'node:crypto';
import { request, sql } from '../db.ts';

export const SESSION_COOKIE = 'senja_session';
/** sesi berakhir bila tidak dipakai selama ini */
export const IDLE_HOURS = 12;
/** batas maksimum sejak login, walau terus dipakai */
export const ABSOLUTE_DAYS = 7;
/** perpanjangan last_seen ditulis paling sering tiap 5 menit agar tidak membebani database */
const TOUCH_MINUTES = 5;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId: number, ip: string | null, userAgent: string | null) {
	const token = randomBytes(32).toString('base64url');
	await (await request())
		.input('id', sql.Char(64), hashToken(token))
		.input('uid', sql.Int, userId)
		.input('ip', sql.VarChar(45), ip?.slice(0, 45) ?? null)
		.input('ua', sql.NVarChar(300), userAgent?.slice(0, 300) ?? null)
		.query(`INSERT INTO dbo.AppSession (id, user_id, expires_at, absolute_expires_at, ip, user_agent)
			VALUES (@id, @uid, DATEADD(HOUR, ${IDLE_HOURS}, SYSUTCDATETIME()), DATEADD(DAY, ${ABSOLUTE_DAYS}, SYSUTCDATETIME()), @ip, @ua)`);
	return token;
}

export interface SessionRow {
	sessionId: string;
	userId: number;
	username: string;
	name: string;
	isAdmin: boolean;
	mustChange: boolean;
	tokoId: string | null;
	/** versi foto profil (null = belum ada foto) */
	avatarVer: number | null;
	/** JSON preferensi tampilan (null = belum pernah disimpan) */
	prefs: string | null;
}

/** Sesi yang masih berlaku & penggunanya aktif, atau null */
export async function readSession(token: string): Promise<SessionRow | null> {
	if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
	const id = hashToken(token);
	const r = await (await request()).input('id', sql.Char(64), id).query(`
		SELECT s.id AS sessionId, u.id AS userId, u.username, u.name, u.is_admin AS isAdmin, u.must_change_password AS mustChange, u.toko_id AS tokoId,
			CASE WHEN p.avatar IS NULL THEN NULL ELSE p.avatar_ver END AS avatarVer, p.prefs,
			CASE WHEN s.last_seen_at < DATEADD(MINUTE, -${TOUCH_MINUTES}, SYSUTCDATETIME()) THEN 1 ELSE 0 END AS stale
		FROM dbo.AppSession s JOIN dbo.AppUser u ON u.id = s.user_id
			LEFT JOIN dbo.AppUserProfile p ON p.user_id = u.id
		WHERE s.id = @id AND s.expires_at > SYSUTCDATETIME() AND s.absolute_expires_at > SYSUTCDATETIME() AND u.active = 1`);
	const row = r.recordset[0];
	if (!row) return null;
	if (row.stale)
		await (await request()).input('id', sql.Char(64), id).query(`
			UPDATE dbo.AppSession SET last_seen_at = SYSUTCDATETIME(),
				expires_at = CASE WHEN DATEADD(HOUR, ${IDLE_HOURS}, SYSUTCDATETIME()) < absolute_expires_at THEN DATEADD(HOUR, ${IDLE_HOURS}, SYSUTCDATETIME()) ELSE absolute_expires_at END
			WHERE id = @id`);
	const { stale: _, ...rest } = row;
	return { ...rest, isAdmin: !!row.isAdmin, mustChange: !!row.mustChange };
}

export async function deleteSession(sessionId: string) {
	await (await request()).input('id', sql.Char(64), sessionId).query('DELETE FROM dbo.AppSession WHERE id = @id');
}

/** Cabut semua sesi pengguna (kecuali sesi yang sedang dipakai bila diberikan) */
export async function deleteUserSessions(userId: number, exceptSessionId?: string) {
	await (await request())
		.input('uid', sql.Int, userId)
		.input('ex', sql.Char(64), exceptSessionId ?? '')
		.query('DELETE FROM dbo.AppSession WHERE user_id = @uid AND id <> @ex');
}

/** Bersihkan sesi kedaluwarsa (dipanggil sesekali saat login) */
export async function purgeExpiredSessions() {
	await (await request()).query('DELETE FROM dbo.AppSession WHERE expires_at <= SYSUTCDATETIME() OR absolute_expires_at <= SYSUTCDATETIME()');
}
