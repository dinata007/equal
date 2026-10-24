/**
 * Pool koneksi SQL Server (satu per proses server). Hanya boleh diimpor dari kode server
 * (+server.ts, +page.server.ts, hooks.server.ts, remote functions).
 */
import sql from 'mssql';
import * as env from '$app/env/private';
import { dbConfig, dbLabel } from './db-config.js';

let pool: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
	if (!pool) {
		const p = new sql.ConnectionPool(dbConfig(env));
		p.on('error', (e) => console.error(`[db] ${dbLabel(env)}:`, e.message));
		// gagal konek → jangan simpan pool rusak, coba lagi di permintaan berikutnya
		pool = p.connect().catch((e) => {
			pool = null;
			throw e;
		});
	}
	return pool;
}

/** Request baru pada pool (parameter: `.input(nama, tipe, nilai)`) */
export const request = async () => (await getPool()).request();

export { sql, dbLabel };

/**
 * Kolom waktu tabel App* disimpan UTC (SYSUTCDATETIME), tapi koneksi membaca tanggal sebagai waktu lokal
 * (useUTC: false, demi tabel lama) → angka jam/menitnya ditafsirkan ulang sebagai UTC. Hasil: ISO string.
 */
export const utcIso = (d: Date | null | undefined) =>
	d ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds())).toISOString() : null;
export const label = () => dbLabel(env);
/** .env sudah berisi koneksi database (tanpanya aplikasi tidak bisa login) */
export const dbConfigured = () => !!(env.DB_SERVER && env.DB_NAME && env.DB_USER);
