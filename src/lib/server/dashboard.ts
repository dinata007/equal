/**
 * Data Dashboard 2: stored procedure sp_Dashboard_* milik aplikasi lama (dashboard Stimulsoft), dijalankan apa adanya
 * supaya angkanya sama. Hanya SP di daftar ini yang bisa dipanggil; nama database dari env (DASHBOARD_*_DB).
 * Hasil disimpan sebentar di memori (data harian, dipakai banyak pengguna) dan dikirim kolom-per-baris agar ringan.
 */
import * as env from '$app/env/private';
import type { SessionUser } from '#lib/domain/types.ts';
import { AuthError } from './auth/users.ts';
import { request } from './db.ts';

/** s = teks (di-trim) · n = angka · ym = periode (tanggal akhir bulan) → yyyy-mm · d = tanggal → yyyy-mm-dd */
type Kind = 's' | 'n' | 'ym' | 'd';
interface DataSet {
	proc: string;
	/** [nama di klien, kolom hasil SP, jenis] */
	fields: [string, string, Kind][];
}
interface Source {
	menu: string;
	db: () => string;
	sets: Record<string, DataSet>;
}

const SOURCES: Record<string, Source> = {
	senja: {
		menu: '/dashboard-2/senja',
		db: () => env.DASHBOARD_SENJA_DB || env.DB_NAME || '',
		sets: {
			sales: { proc: 'sp_Dashboard_Sales', fields: [['toko', 'Toko', 's'], ['dept', 'Dept', 's'], ['ym', 'Periode', 'ym'], ['d', 'Tanggal', 'n'], ['qty', 'Qty', 'n'], ['nilai', 'Nilai', 'n']] },
			stok: { proc: 'sp_Dashboard_Stok', fields: [['brand', 'brand', 's'], ['dept', 'dept', 's'], ['stok', 'stok', 'n']] }
		}
	},
	jp: {
		menu: '/dashboard-2/jp',
		db: () => env.DASHBOARD_JP_DB || 'JP',
		sets: {
			sales: { proc: 'sp_Dashboard_Sales', fields: [['brand', 'Brand', 's'], ['spk', 'SPK', 's'], ['artikel', 'Artikel', 's'], ['ym', 'Periode', 'ym'], ['d', 'Tanggal', 'n'], ['qty', 'Qty', 'n'], ['nilai', 'Nilai', 'n']] },
			beli: { proc: 'sp_Dashboard_Beli', fields: [['brand', 'Brand', 's'], ['supplier', 'Supplier', 's'], ['jenis', 'Jenis', 's'], ['ym', 'Periode', 'ym'], ['d', 'Tanggal', 'n'], ['qty', 'Qty', 'n'], ['nilai', 'Nilai', 'n']] },
			stok: { proc: 'sp_Dashboard_Stok', fields: [['gudang', 'Gudang', 's'], ['brand', 'Brand', 's'], ['stok', 'Stok', 'n'], ['updated', 'Updated', 'd']] }
		}
	}
};

export interface DashboardData {
	/** waktu data diambil dari database (ISO) */
	at: string;
	/** nama database sumber (ditampilkan, mis. SENJA_DEMO) */
	db: string;
	cols: string[];
	rows: (string | number | null)[][];
}

const TTL = 5 * 60_000;
/** muat ulang paksa paling cepat tiap 15 detik (tombol refresh ditekan berulang tidak membebani server) */
const MIN_FRESH = 15_000;
const cache = new Map<string, { at: number; data: Promise<DashboardData> }>();

const pad = (n: number) => String(n).padStart(2, '0');
// koneksi membaca tanggal sebagai waktu lokal (useUTC: false) → pakai komponen lokal
function convert(v: unknown, kind: Kind) {
	if (v == null) return kind === 's' ? '' : null;
	if (kind === 's') return String(v).trim();
	if (kind === 'n') return Number(v) || 0;
	if (!(v instanceof Date)) return null;
	return kind === 'ym' ? `${v.getFullYear()}-${pad(v.getMonth() + 1)}` : `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
}

async function run(db: string, set: DataSet): Promise<DashboardData> {
	// nama database tidak bisa jadi parameter → hanya huruf/angka/garis bawah, diapit []
	if (!/^\w{1,128}$/.test(db)) throw new Error(`Nama database dashboard tidak valid: ${db}`);
	const r = await (await request()).execute(`[${db}].[dbo].[${set.proc}]`);
	const rows = (r.recordset ?? []).map((row: Record<string, unknown>) => set.fields.map(([, col, kind]) => convert(row[col], kind)));
	return { at: new Date().toISOString(), db, cols: set.fields.map(([k]) => k), rows };
}

export async function dashboardData(user: SessionUser, source: string, setName: string, fresh: boolean): Promise<DashboardData> {
	const src = Object.hasOwn(SOURCES, source) ? SOURCES[source] : undefined;
	const set = src && Object.hasOwn(src.sets, setName) ? src.sets[setName] : undefined;
	if (!src || !set) throw new AuthError('Data tidak ditemukan', 404);
	if (!user.admin && !user.menus.includes(src.menu)) throw new AuthError('Anda tidak punya akses ke dashboard ini', 403);

	const db = src.db();
	const key = `${db}.${set.proc}`;
	const hit = cache.get(key);
	const age = hit ? Date.now() - hit.at : Infinity;
	if (hit && age < (fresh ? MIN_FRESH : TTL)) return hit.data;

	const data = run(db, set);
	cache.set(key, { at: Date.now(), data });
	// gagal → jangan disimpan, permintaan berikutnya mencoba lagi
	data.catch(() => cache.get(key)?.data === data && cache.delete(key));
	return data;
}
