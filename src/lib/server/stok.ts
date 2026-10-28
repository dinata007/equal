/**
 * Posisi stok gudang untuk Dashboard. Hanya baca, aturan sama dengan sp_Dashboard_Stok aplikasi lama:
 * stok = saldo awal bulan (S_AWAL_GUDANG) + mutasi T_GUDANG sejak awal bulan (status IN menambah, OUT mengurangi).
 * Server hanya mengirim saldo awal bulan dari tanggal `from` dan mutasi per hari; stok pada tanggal mana pun
 * dihitung di browser (saldo awal + mutasi kumulatif), jadi pembanding antarperiode tidak perlu permintaan baru.
 * Nilai persediaan = qty × harga beli produk saat ini. Disaring cakupan brand pengguna.
 */
import type { SessionUser } from '#lib/domain/types.ts';
import { AuthError } from './auth/users.ts';
import { request } from './db.ts';
import { brandScope, brandWhere } from './master/service.ts';

export interface StokData {
	at: string;
	/** tanggal awal bulan dari `from` (titik saldo awal) */
	anchor: string;
	/** false bila saldo awal bulan itu belum ada di database (belum closing) → stok tidak bisa dihitung */
	ready: boolean;
	/** saldo awal: [qty, nilai] */
	awal: [number, number];
	/** mutasi bersih per hari: [tanggal, qty, nilai] */
	days: [string, number, number][];
}

const TTL = 5 * 60_000;
const MIN_FRESH = 15_000;
const MAX_SPAN_DAYS = 500;
const cache = new Map<string, { at: number; data: Promise<StokData> }>();
const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

async function run(from: string, to: string, scope: string[] | null): Promise<StokData> {
	const req = await request();
	req.input('pf', from);
	req.input('pt', to);
	const brand = brandWhere(req, 'p.brand_id', false, scope);
	const r = await req.query(`
		SET NOCOUNT ON;
		DECLARE @m date = DATEFROMPARTS(YEAR(CAST(@pf AS date)), MONTH(CAST(@pf AS date)), 1), @t date = DATEADD(DAY, 1, CAST(@pt AS date));
		SELECT COUNT(*) n, ISNULL(SUM(a.qty), 0) qty, ISNULL(SUM(a.qty * ISNULL(p.hbeli, 0)), 0) nilai, CONVERT(char(10), @m, 23) anchor
		FROM S_AWAL_GUDANG a LEFT JOIN View_produk p ON p.produk_id = a.produk_id
		WHERE a.periode = @m AND ${brand};
		SELECT CONVERT(char(10), g.tgl, 23) d,
		       SUM(CASE g.status WHEN 'IN' THEN l.qty ELSE -l.qty END) qty,
		       SUM(CASE g.status WHEN 'IN' THEN l.qty ELSE -l.qty END * ISNULL(p.hbeli, 0)) nilai
		FROM T_GUDANG1 g JOIN T_GUDANG2 l ON l.bukti = g.bukti LEFT JOIN View_produk p ON p.produk_id = l.produk_id
		WHERE g.tgl >= @m AND g.tgl < @t AND ${brand}
		GROUP BY CONVERT(char(10), g.tgl, 23);`);
	const [awal, days] = r.recordsets as unknown as Record<string, any>[][];
	return {
		at: new Date().toISOString(),
		anchor: awal[0].anchor,
		ready: awal[0].n > 0,
		awal: [+awal[0].qty || 0, Math.round(+awal[0].nilai || 0)],
		days: days.map((x) => [x.d, +x.qty || 0, Math.round(+x.nilai || 0)] as StokData['days'][number])
	};
}

export async function stok(user: SessionUser, from: unknown, to: unknown, fresh: boolean): Promise<StokData> {
	if (!user.admin && !user.menus.some((m) => m.startsWith('/inventory/'))) throw new AuthError('Anda tidak punya akses ke data stok', 403);
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
