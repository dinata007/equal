/**
 * Data pembelian untuk Dashboard (pembanding Tren Penjualan). Hanya baca, dari tabel aplikasi lama.
 * Pembelian = penerimaan barang di gudang (T_GUDANG1/2, tipe_trans TERIMA, status IN) pada tanggal terima,
 * bukan tanggal PO. Retur ke supplier tidak dikurangkan. Nilai baris = total baris × (total dokumen ÷ jumlah
 * total baris), jadi diskon dokumen ikut terbagi. Dikirim per (tanggal, kategori) dan disaring cakupan brand.
 */
import type { SessionUser } from '#lib/domain/types.ts';
import { AuthError } from './auth/users.ts';
import { request } from './db.ts';
import { brandScope, brandWhere } from './master/service.ts';

export interface PembelianData {
	at: string;
	/** [tanggal, kategori, qty, nilai] */
	rows: [string, string, number, number][];
}

const TTL = 5 * 60_000;
const MIN_FRESH = 15_000;
const MAX_SPAN_DAYS = 400;
const cache = new Map<string, { at: number; data: Promise<PembelianData> }>();
const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

async function run(from: string, to: string, scope: string[] | null): Promise<PembelianData> {
	const req = await request();
	req.input('pf', from);
	req.input('pt', to);
	const brand = brandWhere(req, 'p.brand_id', false, scope);
	const r = await req.query(`
		SET NOCOUNT ON;
		DECLARE @f date = CAST(@pf AS date), @t date = DATEADD(DAY, 1, CAST(@pt AS date));
		SELECT CONVERT(char(10), g.tgl, 23) d, ISNULL(RTRIM(p.grup), '-') cat, SUM(l.qty) qty,
		       SUM(ISNULL(l.total * g.total / NULLIF(s.sum_total, 0), l.total)) nilai
		FROM T_GUDANG1 g
		JOIN T_GUDANG2 l ON l.bukti = g.bukti
		JOIN (SELECT bukti, SUM(total) sum_total FROM T_GUDANG2 GROUP BY bukti) s ON s.bukti = g.bukti
		LEFT JOIN View_produk p ON p.produk_id = l.produk_id
		WHERE g.status = 'IN' AND g.tipe_trans = 'TERIMA' AND g.total > 0 AND g.tgl >= @f AND g.tgl < @t AND ${brand}
		GROUP BY CONVERT(char(10), g.tgl, 23), ISNULL(RTRIM(p.grup), '-');`);
	return {
		at: new Date().toISOString(),
		rows: (r.recordset as Record<string, any>[]).map((x) => [x.d, x.cat, +x.qty || 0, Math.round(+x.nilai || 0)] as PembelianData['rows'][number])
	};
}

export async function pembelian(user: SessionUser, from: unknown, to: unknown, fresh: boolean): Promise<PembelianData> {
	if (!user.admin && !user.menus.some((m) => m.startsWith('/inventory/'))) throw new AuthError('Anda tidak punya akses ke data pembelian', 403);
	if (!isDate(from) || !isDate(to) || from > to || (Date.parse(to) - Date.parse(from)) / 864e5 > MAX_SPAN_DAYS) throw new AuthError('Rentang tanggal tidak valid');
	const scope = brandScope(user);
	const key = `${from}|${to}|${scope?.slice().sort().join(',') ?? '*'}`;
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < (fresh ? MIN_FRESH : TTL)) return hit.data;
	const entry = { at: Date.now(), data: run(from, to, scope) };
	cache.set(key, entry);
	entry.data.catch(() => cache.get(key) === entry && cache.delete(key));
	if (cache.size > 50) cache.delete(cache.keys().next().value!);
	return entry.data;
}
