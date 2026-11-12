/**
 * Posisi stok toko untuk Dashboard. Hanya baca, mengikuti rumus laporan PowerBuilder w_02b_r01_acc /
 * d_02b_r01_acc: saldo S_AWAL_TOKO + mutasi TERIMA, RETUR, JUAL, dan RETUR JUAL.
 * Nilai akhir = qty × M_PRODUK.hjual (dipetakan sebagai hbeli di DataWindow tersebut).
 */
import type { SessionUser } from '#lib/domain/types.ts';
import { AuthError } from './auth/users.ts';
import { request } from './db.ts';
import { brandScope, brandWhere } from './master/service.ts';

export interface StokData {
	at: string;
	/** tanggal posisi stok */
	date: string;
	/** false bila belum ada saldo awal untuk periode posisi */
	ready: boolean;
	/** posisi akhir: [qty, nilai] */
	balance: [number, number];
	/** rincian posisi akhir per kategori: [nama, qty, nilai] */
	categories: [string, string, number, number][];
}

const TTL = 5 * 60_000;
const MIN_FRESH = 15_000;
const MAX_SPAN_DAYS = 630;
const cache = new Map<string, { at: number; data: Promise<StokData> }>();
const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

async function run(to: string, scope: string[] | null): Promise<StokData> {
	const req = await request();
	req.input('pt', to);
	const brand = brandWhere(req, 'p.brand_id', false, scope);
	const r = await req.query(`
		SET NOCOUNT ON;
		DECLARE @asof date = CAST(@pt AS date),
		        @anchor date = DATEFROMPARTS(YEAR(CAST(@pt AS date)), MONTH(CAST(@pt AS date)), 1);
		;WITH StoreOpening AS (
			SELECT a.toko_id, a.produk_id, SUM(a.qty) qty
			FROM S_AWAL_TOKO a
			WHERE CAST(a.periode AS date) = @anchor
			GROUP BY a.toko_id, a.produk_id
		),
		StoreIds AS (
			SELECT DISTINCT toko_id FROM StoreOpening
		),
		StoreMovement AS (
			SELECT l.produk_id,
			       SUM(CASE
			            WHEN g.tipe_trans = 'TERIMA' THEN l.qty
			            WHEN g.tipe_trans = 'RETUR' THEN -l.qty
			            WHEN g.tipe_trans = 'JUAL'
			             AND UPPER(ISNULL(g.tipe_bayar, '')) <> 'BATAL' THEN -l.qty
			            WHEN g.tipe_trans = 'RETUR JUAL'
			             AND UPPER(ISNULL(g.tipe_bayar, '')) <> 'BATAL' THEN l.qty
			            ELSE 0
			       END) qty
			FROM T_TOKO1 g
			JOIN T_TOKO2 l ON l.site_id = g.site_id AND l.bukti = g.bukti
			WHERE g.tgl >= @anchor AND g.tgl < DATEADD(DAY, 1, @asof)
			  AND EXISTS (SELECT 1 FROM StoreIds s WHERE s.toko_id = g.toko_id)
			  AND g.tipe_trans IN ('TERIMA', 'RETUR', 'JUAL', 'RETUR JUAL')
			GROUP BY l.produk_id
		),
		Balance AS (
			SELECT produk_id, SUM(qty) qty FROM StoreOpening GROUP BY produk_id
			UNION ALL
			SELECT produk_id, qty FROM StoreMovement
		),
		ProductBalance AS (
			SELECT produk_id, SUM(qty) qty FROM Balance GROUP BY produk_id
		)
		SELECT GROUPING(d.grup_dept) is_total,
		       CASE WHEN GROUPING(d.grup_dept) = 1 THEN '' ELSE COALESCE(NULLIF(RTRIM(d.grup_dept), ''), '-') END category_id,
		       CASE WHEN GROUPING(d.grup_dept) = 1 THEN '' ELSE COALESCE(NULLIF(RTRIM(d.nama), ''), '-') END category,
		       CONVERT(char(10), @asof, 23) date,
		       CASE WHEN EXISTS (SELECT 1 FROM StoreOpening) THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END ready,
		       ISNULL(SUM(ISNULL(b.qty, 0)), 0) qty,
		       ISNULL(SUM(ISNULL(b.qty, 0) * ISNULL(p.hjual, 0)), 0) nilai
		FROM M_PRODUK p
		LEFT JOIN ProductBalance b ON b.produk_id = p.produk_id
		LEFT JOIN M_PRODUK_DEPT d ON d.grup_dept = p.grup_dept
		WHERE ${brand}
		GROUP BY GROUPING SETS ((d.grup_dept, d.nama), ());`);
	const records = r.recordset as Record<string, any>[];
	const total = records.find((x) => !!x.is_total);
	return {
		at: new Date().toISOString(),
		date: String(total?.date ?? to),
		ready: !!total?.ready,
		balance: [+total?.qty || 0, Math.round(+total?.nilai || 0)],
		categories: records
			.filter((x) => !x.is_total)
			.map((x) => [String(x.category_id), String(x.category), +x.qty || 0, Math.round(+x.nilai || 0)] as StokData['categories'][number])
			.sort((a, b) => b[3] - a[3] || a[1].localeCompare(b[1]))
	};
}

export async function stok(user: SessionUser, from: unknown, to: unknown, fresh: boolean): Promise<StokData> {
	if (!user.admin && !user.menus.some((m) => m.startsWith('/inventory/'))) throw new AuthError('Anda tidak punya akses ke data stok', 403);
	if (!isDate(from) || !isDate(to) || from > to || (Date.parse(to) - Date.parse(from)) / 864e5 > MAX_SPAN_DAYS) throw new AuthError('Rentang tanggal tidak valid');
	const scope = brandScope(user);
	const key = `${to}|${scope?.slice().sort().join(',') ?? '*'}`;
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < (fresh ? MIN_FRESH : TTL)) return hit.data;
	const entry = { at: Date.now(), data: run(to, scope) };
	cache.set(key, entry);
	entry.data.catch(() => cache.get(key) === entry && cache.delete(key));
	if (cache.size > 50) cache.delete(cache.keys().next().value!);
	return entry.data;
}
