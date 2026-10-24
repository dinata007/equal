/**
 * Profil milik pengguna sendiri: preferensi tampilan, foto, sesi aktif & riwayat keamanan.
 * Semua fungsi hanya menyentuh data pengguna yang login (userId dari sesi, bukan dari browser).
 */
import { cleanPrefs } from '#lib/domain/prefs.ts';
import { request, sql, utcIso } from '../db.ts';
import { audit } from './audit.ts';
import { AuthError } from './users.ts';

/** foto sudah di-crop & dikecilkan di browser (512 px), jadi 512 KB sangat longgar */
export const AVATAR_MAX_BYTES = 512 * 1024;
/** potongan awal hash sesi yang dipakai sebagai rujukan di browser (bukan token, tidak bisa dipakai login) */
const REF_LEN = 16;

/* ---------------- preferensi tampilan ---------------- */
export async function savePrefs(userId: number, raw: unknown) {
	const prefs = cleanPrefs(raw);
	await (await request())
		.input('uid', sql.Int, userId)
		.input('p', sql.NVarChar(1000), JSON.stringify(prefs))
		.query(`UPDATE dbo.AppUserProfile SET prefs = @p, updated_at = SYSUTCDATETIME() WHERE user_id = @uid;
			IF @@ROWCOUNT = 0 INSERT INTO dbo.AppUserProfile (user_id, prefs) VALUES (@uid, @p);`);
	return prefs;
}

/* ---------------- foto ---------------- */
/** jenis gambar dari isi file (bukan dari header/nama file yang bisa dipalsukan) */
function imageType(b: Uint8Array): string | null {
	if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
	if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
	const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
	if (b.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
	return null;
}

export async function saveAvatar(userId: number, username: string, bytes: Uint8Array, ip: string) {
	if (!bytes.length) throw new AuthError('Foto kosong');
	if (bytes.length > AVATAR_MAX_BYTES) throw new AuthError('Ukuran foto maksimal 512 KB', 413);
	const type = imageType(bytes);
	if (!type) throw new AuthError('Format foto harus WebP, PNG, atau JPEG', 415);
	const r = await (await request())
		.input('uid', sql.Int, userId)
		.input('a', sql.VarBinary(sql.MAX), Buffer.from(bytes))
		.input('t', sql.VarChar(20), type)
		.query(`UPDATE dbo.AppUserProfile SET avatar = @a, avatar_type = @t, avatar_ver = avatar_ver + 1, updated_at = SYSUTCDATETIME()
				OUTPUT inserted.avatar_ver AS ver WHERE user_id = @uid;
			IF @@ROWCOUNT = 0 INSERT INTO dbo.AppUserProfile (user_id, avatar, avatar_type, avatar_ver) OUTPUT inserted.avatar_ver AS ver VALUES (@uid, @a, @t, 1);`);
	await audit('profile_avatar', { userId, username, ip });
	return (r.recordsets as unknown as { ver: number }[][]).flat()[0].ver;
}

export async function removeAvatar(userId: number, username: string, ip: string) {
	await (await request())
		.input('uid', sql.Int, userId)
		.query('UPDATE dbo.AppUserProfile SET avatar = NULL, avatar_type = NULL, avatar_ver = avatar_ver + 1, updated_at = SYSUTCDATETIME() WHERE user_id = @uid');
	await audit('profile_avatar_remove', { userId, username, ip });
}

export async function readAvatar(userId: number) {
	const row = (
		await (await request())
			.input('uid', sql.Int, userId)
			.query('SELECT avatar, avatar_type, avatar_ver FROM dbo.AppUserProfile WHERE user_id = @uid AND avatar IS NOT NULL')
	).recordset[0];
	return row ? { data: row.avatar as Buffer, type: row.avatar_type as string, ver: row.avatar_ver as number } : null;
}

/* ---------------- keamanan: sesi aktif & riwayat ---------------- */
export interface DeviceSession {
	ref: string;
	current: boolean;
	createdAt: string;
	lastSeenAt: string;
	ip: string | null;
	userAgent: string | null;
}
export interface SecurityEvent {
	event: string;
	at: string;
	ip: string | null;
	detail: string | null;
}

/** event yang relevan bagi pemilik akun (urutan = yang ditampilkan) */
const OWN_EVENTS = ['login_ok', 'login_fail', 'login_lock', 'login_locked', 'password_change', 'session_revoke', 'profile_avatar'];

export async function security(userId: number, currentSessionId: string) {
	const r = await (await request()).input('uid', sql.Int, userId).query(`
		SELECT id, created_at, last_seen_at, ip, user_agent FROM dbo.AppSession
			WHERE user_id = @uid AND expires_at > SYSUTCDATETIME() AND absolute_expires_at > SYSUTCDATETIME()
			ORDER BY last_seen_at DESC;
		SELECT TOP 12 event, at, ip, detail FROM dbo.AppAuditLog
			WHERE user_id = @uid AND event IN (${OWN_EVENTS.map((e) => `'${e}'`).join(',')})
			ORDER BY id DESC;
		SELECT password_changed_at, created_at FROM dbo.AppUser WHERE id = @uid;`);
	const [sess, events, user] = r.recordsets as unknown as Record<string, any>[][];
	const iso = utcIso;
	return {
		passwordChangedAt: iso(user[0]?.password_changed_at),
		accountCreatedAt: iso(user[0]?.created_at),
		sessions: sess.map(
			(s): DeviceSession => ({
				ref: s.id.slice(0, REF_LEN),
				current: s.id === currentSessionId,
				createdAt: iso(s.created_at)!,
				lastSeenAt: iso(s.last_seen_at)!,
				ip: s.ip,
				userAgent: s.user_agent
			})
		),
		activity: events.map((e): SecurityEvent => ({ event: e.event, at: iso(e.at)!, ip: e.ip, detail: e.detail }))
	};
}

/** cabut satu sesi (ref) atau semua sesi lain (ref = '*'); sesi yang sedang dipakai tidak ikut (pakai Keluar) */
export async function revokeSessions(userId: number, username: string, currentSessionId: string, ref: string, ip: string) {
	if (ref !== '*' && !/^[0-9a-f]{16}$/.test(ref)) throw new AuthError('Sesi tidak dikenal');
	const r = await (await request())
		.input('uid', sql.Int, userId)
		.input('cur', sql.Char(64), currentSessionId)
		.input('ref', sql.Char(REF_LEN), ref === '*' ? '' : ref)
		.query(`DELETE FROM dbo.AppSession WHERE user_id = @uid AND id <> @cur ${ref === '*' ? '' : `AND LEFT(id, ${REF_LEN}) = @ref`}`);
	const n = r.rowsAffected[0] ?? 0;
	if (n) await audit('session_revoke', { userId, username, ip, detail: ref === '*' ? `semua perangkat lain (${n})` : '1 perangkat' });
	return n;
}
