/** Cek koneksi database: GET /api/health → status, nama database & versi SQL Server (tanpa data). */
import { json } from '@sveltejs/kit';
import { label, request } from '#lib/server/db.ts';

export async function GET() {
	const started = Date.now();
	try {
		const r = await (await request()).query<{ db: string; version: string; edition: string }>(
			`SELECT DB_NAME() AS db, CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(32)) AS version, CAST(SERVERPROPERTY('Edition') AS nvarchar(128)) AS edition`
		);
		const row = r.recordset[0];
		return json({ ok: true, database: row.db, version: row.version, edition: row.edition, ms: Date.now() - started });
	} catch (e) {
		// pesan driver tidak memuat password; cukup untuk diagnosa (host salah, login gagal, db tidak ada)
		console.error(`[db] gagal konek ke ${label()}:`, e);
		return json({ ok: false, target: label(), error: e instanceof Error ? e.message : String(e) }, { status: 503 });
	}
}
