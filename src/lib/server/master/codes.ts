/** Penomoran kode master meniru aplikasi PowerBuilder (dijalankan dalam transaksi, baris ditahan sampai commit). */
import { sql } from '../db.ts';

/** nomor urut berikutnya dari kolom kode berawalan tetap, mis. S341 → S342 */
export async function seq(req: sql.Request, table: string, col: string, prefix: string, width: number, where = '1 = 1') {
	const r = await req.input('_pfx', sql.VarChar(50), prefix).query(`
		SELECT MAX(TRY_CAST(SUBSTRING(${col}, LEN(@_pfx) + 1, 20) AS int)) AS n
		FROM ${table} WITH (UPDLOCK, HOLDLOCK)
		WHERE ${col} LIKE @_pfx + '%' AND ${where}`);
	return prefix + String((r.recordset[0]?.n ?? 0) + 1).padStart(width, '0');
}

/** 2 digit tahun berjalan */
export const yy = (d = new Date()) => String(d.getFullYear()).slice(2);

/** teks apa adanya di dalam pola LIKE */
export const likeEscape = (s: string) => s.replace(/[[%_]/g, (c) => `[${c}]`);

/** 0 → AAA, 1 → AAB, … (huruf berurut 3 digit basis 26, seperti kode department PB) */
export const letters3 = (n: number) => [676, 26, 1].map((d) => String.fromCharCode(65 + (Math.floor(n / d) % 26))).join('');

/** kode diketik pengguna, atau nomor berikutnya bila kosong (hook `next` resource master) */
export const kodeUrut = (table: string, col: string, width: number) => async (req: () => sql.Request, v: Record<string, any>) => {
	if (!v[col]) v[col] = await seq(req(), table, col, '', width);
};
