/** Jejak keamanan ke dbo.AppAuditLog (gagal mencatat tidak boleh menggagalkan proses utama). */
import { request, sql } from '../db.ts';

export interface AuditInfo {
	userId?: number | null;
	username?: string | null;
	ip?: string | null;
	detail?: string;
}

export async function audit(event: string, info: AuditInfo = {}) {
	try {
		await (await request())
			.input('uid', sql.Int, info.userId ?? null)
			.input('u', sql.VarChar(30), info.username?.slice(0, 30) ?? null)
			.input('e', sql.VarChar(40), event)
			.input('ip', sql.VarChar(45), info.ip?.slice(0, 45) ?? null)
			.input('d', sql.NVarChar(500), info.detail?.slice(0, 500) ?? null)
			.query('INSERT INTO dbo.AppAuditLog (user_id, username, event, ip, detail) VALUES (@uid, @u, @e, @ip, @d)');
	} catch (e) {
		console.error('[audit] gagal mencatat', event, e);
	}
}
