import type { SessionUser } from '#lib/domain/types.ts';
import { AuthError } from './auth/users.ts';
import { request, sql } from './db.ts';
import { brandScope, brandWhere } from './master/service.ts';

export interface TokoStockRow {
	id: string;
	code: string;
	name: string;
	unit: string;
	price: number;
	open: number;
	in: number;
	out: number;
	close: number;
}

export interface TokoStockMutation {
	ready: boolean;
	rows: TokoStockRow[];
}

export interface TokoStockCard {
	ready: boolean;
	item: { id: string; code: string; name: string; unit: string; price: number } | null;
	opening: number;
	rows: { date: string; no: string; label: string; qty: number; bal: number }[];
	totIn: number;
	totOut: number;
	closing: number;
}

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const MAX_SPAN_DAYS = 630;

function reportParams(user: SessionUser, from: unknown, to: unknown) {
	if (!user.admin && !user.menus.some((m) => m === '/toko/report/mutasi-stok' || m === '/toko/report/kartu-stok'))
		throw new AuthError('Anda tidak punya akses ke laporan stok toko', 403);
	if (!isDate(from) || !isDate(to) || from > to || (Date.parse(to) - Date.parse(from)) / 864e5 > MAX_SPAN_DAYS)
		throw new AuthError('Rentang tanggal tidak valid');
	return { from, to, scope: brandScope(user) };
}

function storeValue(store: unknown) {
	const value = String(store ?? '').trim();
	if (value.length > 5) throw new AuthError('Kode toko tidak valid');
	return value;
}

const MOVEMENT_QTY = `CASE
	WHEN g.tipe_trans = 'TERIMA' THEN l.qty
	WHEN g.tipe_trans = 'RETUR' THEN -l.qty
	WHEN g.tipe_trans = 'JUAL'
	 AND UPPER(ISNULL(g.tipe_bayar, '')) <> 'BATAL' THEN -l.qty
	WHEN g.tipe_trans = 'RETUR JUAL'
	 AND UPPER(ISNULL(g.tipe_bayar, '')) <> 'BATAL' THEN l.qty
	ELSE 0
END`;

export async function tokoStockMutation(user: SessionUser, from: unknown, to: unknown, store: unknown, onlyMoving: boolean): Promise<TokoStockMutation> {
	const p = reportParams(user, from, to);
	const storeId = storeValue(store);
	const req = await request();
	req.input('pf', sql.Date, p.from);
	req.input('pt', sql.Date, p.to);
	req.input('store', sql.VarChar(5), storeId);
	req.input('moving', sql.Bit, onlyMoving);
	const brand = brandWhere(req, 'p.brand_id', false, p.scope);
	const result = await req.query(`
		SET NOCOUNT ON;
		DECLARE @anchor date = DATEFROMPARTS(YEAR(@pf), MONTH(@pf), 1),
		        @end date = DATEADD(DAY, 1, @pt);
		SELECT CAST(CASE WHEN EXISTS (
			SELECT 1 FROM S_AWAL_TOKO a
			WHERE CAST(a.periode AS date) = @anchor AND (@store = '' OR a.toko_id = @store)
		) THEN 1 ELSE 0 END AS bit) ready;

		;WITH StoreOpening AS (
			SELECT a.toko_id, a.produk_id, SUM(a.qty) qty
			FROM S_AWAL_TOKO a
			WHERE CAST(a.periode AS date) = @anchor AND (@store = '' OR a.toko_id = @store)
			GROUP BY a.toko_id, a.produk_id
		),
		StoreIds AS (SELECT DISTINCT toko_id FROM StoreOpening),
		Movement AS (
			SELECT l.produk_id,
			       SUM(CASE WHEN g.tgl < @pf THEN ${MOVEMENT_QTY} ELSE 0 END) before_qty,
			       SUM(CASE WHEN g.tgl >= @pf THEN CASE WHEN ${MOVEMENT_QTY} > 0 THEN ${MOVEMENT_QTY} ELSE 0 END ELSE 0 END) in_qty,
			       SUM(CASE WHEN g.tgl >= @pf THEN CASE WHEN ${MOVEMENT_QTY} < 0 THEN -(${MOVEMENT_QTY}) ELSE 0 END ELSE 0 END) out_qty
			FROM T_TOKO1 g
			JOIN T_TOKO2 l ON l.site_id = g.site_id AND l.bukti = g.bukti
			WHERE g.tgl >= @anchor AND g.tgl < @end
			  AND g.tipe_trans IN ('TERIMA', 'RETUR', 'JUAL', 'RETUR JUAL')
			  AND EXISTS (SELECT 1 FROM StoreIds s WHERE s.toko_id = g.toko_id)
			GROUP BY l.produk_id
		),
		Opening AS (
			SELECT produk_id, SUM(qty) qty FROM StoreOpening GROUP BY produk_id
		)
		SELECT RTRIM(p.produk_id) id, RTRIM(p.produk_id) code, RTRIM(ISNULL(p.nama, '')) name,
		       CAST('pcs' AS varchar(10)) unit, ISNULL(p.hjual, 0) price,
		       ISNULL(o.qty, 0) + ISNULL(m.before_qty, 0) [open],
		       ISNULL(m.in_qty, 0) [in], ISNULL(m.out_qty, 0) [out],
		       ISNULL(o.qty, 0) + ISNULL(m.before_qty, 0) + ISNULL(m.in_qty, 0) - ISNULL(m.out_qty, 0) [close]
		FROM M_PRODUK p
		LEFT JOIN Opening o ON o.produk_id = p.produk_id
		LEFT JOIN Movement m ON m.produk_id = p.produk_id
		WHERE ${brand}
		  AND (ISNULL(o.qty, 0) <> 0 OR ISNULL(m.before_qty, 0) <> 0 OR ISNULL(m.in_qty, 0) <> 0 OR ISNULL(m.out_qty, 0) <> 0)
		  AND (@moving = 0 OR ISNULL(m.in_qty, 0) <> 0 OR ISNULL(m.out_qty, 0) <> 0)
		ORDER BY p.produk_id;`);
	const [status, records] = result.recordsets as unknown as Record<string, any>[][];
	return {
		ready: !!status[0]?.ready,
		rows: records.map((r) => ({
			id: String(r.id).trim(),
			code: String(r.code).trim(),
			name: String(r.name).trim(),
			unit: String(r.unit),
			price: +r.price || 0,
			open: +r.open || 0,
			in: +r.in || 0,
			out: +r.out || 0,
			close: +r.close || 0
		}))
	};
}

export async function tokoStockProducts(user: SessionUser, query: unknown) {
	if (!user.admin && !user.menus.some((m) => m === '/toko/report/mutasi-stok' || m === '/toko/report/kartu-stok'))
		throw new AuthError('Anda tidak punya akses ke laporan stok toko', 403);
	const q = String(query ?? '').trim();
	if (q.length < 2 || q.length > 50) throw new AuthError('Masukkan minimal 2 karakter untuk mencari produk');
	const req = await request();
	req.input('q', sql.VarChar(50), `%${q}%`);
	req.input('prefix', sql.VarChar(50), `${q}%`);
	const brand = brandWhere(req, 'p.brand_id', false, brandScope(user));
	const result = await req.query(`
		SELECT TOP (30) RTRIM(p.produk_id) id, RTRIM(p.produk_id) code, RTRIM(ISNULL(p.nama, '')) name
		FROM M_PRODUK p
		WHERE ${brand} AND (p.produk_id LIKE @prefix OR p.nama LIKE @q)
		ORDER BY CASE WHEN p.produk_id LIKE @prefix THEN 0 ELSE 1 END, p.produk_id;`);
	return result.recordset.map((r) => ({ id: String(r.id).trim(), code: String(r.code).trim(), name: String(r.name).trim() }));
}

export async function tokoStockCard(user: SessionUser, item: unknown, from: unknown, to: unknown, store: unknown): Promise<TokoStockCard> {
	const p = reportParams(user, from, to);
	const itemId = String(item ?? '').trim();
	if (!itemId || itemId.length > 20) throw new AuthError('Produk tidak valid');
	const storeId = storeValue(store);
	const req = await request();
	req.input('pf', sql.Date, p.from);
	req.input('pt', sql.Date, p.to);
	req.input('store', sql.VarChar(5), storeId);
	req.input('item', sql.VarChar(20), itemId);
	const brand = brandWhere(req, 'p.brand_id', false, p.scope);
	const result = await req.query(`
		SET NOCOUNT ON;
		DECLARE @anchor date = DATEFROMPARTS(YEAR(@pf), MONTH(@pf), 1),
		        @end date = DATEADD(DAY, 1, @pt);
		SELECT RTRIM(p.produk_id) id, RTRIM(p.produk_id) code, RTRIM(ISNULL(p.nama, '')) name,
		       CAST('pcs' AS varchar(10)) unit, ISNULL(p.hjual, 0) price
		FROM M_PRODUK p WHERE p.produk_id = @item AND ${brand};

		SELECT CAST(CASE WHEN EXISTS (
			SELECT 1 FROM S_AWAL_TOKO a
			WHERE CAST(a.periode AS date) = @anchor AND (@store = '' OR a.toko_id = @store)
		) THEN 1 ELSE 0 END AS bit) ready,
		ISNULL(SUM(a.qty), 0) opening
		FROM S_AWAL_TOKO a
		WHERE CAST(a.periode AS date) = @anchor AND (@store = '' OR a.toko_id = @store) AND a.produk_id = @item;

		;WITH StoreOpening AS (
			SELECT a.toko_id FROM S_AWAL_TOKO a
			WHERE CAST(a.periode AS date) = @anchor AND (@store = '' OR a.toko_id = @store)
			GROUP BY a.toko_id
		)
		SELECT CONVERT(char(10), g.tgl, 23) date,
		       CASE WHEN @store = '' THEN RTRIM(ISNULL(g.toko_id, '')) + '/' + RTRIM(g.bukti) ELSE RTRIM(g.bukti) END no,
		       g.tipe_trans label,
		       SUM(${MOVEMENT_QTY}) qty
		FROM T_TOKO1 g
		JOIN T_TOKO2 l ON l.site_id = g.site_id AND l.bukti = g.bukti
		WHERE l.produk_id = @item
		  AND g.tgl >= @anchor AND g.tgl < @end
		  AND g.tipe_trans IN ('TERIMA', 'RETUR', 'JUAL', 'RETUR JUAL')
		  AND EXISTS (SELECT 1 FROM StoreOpening s WHERE s.toko_id = g.toko_id)
		GROUP BY CONVERT(char(10), g.tgl, 23), g.toko_id, g.site_id, g.bukti, g.tipe_trans
		HAVING SUM(${MOVEMENT_QTY}) <> 0
		ORDER BY date, CASE WHEN SUM(${MOVEMENT_QTY}) > 0 THEN 0 ELSE 1 END, no;`);
	const [products, balances, movements] = result.recordsets as unknown as Record<string, any>[][];
	const product = products[0];
	if (!product) throw new AuthError('Produk tidak tersedia dalam cakupan akun', 404);
	const ready = !!balances[0]?.ready;
	const rows: TokoStockCard['rows'] = [];
	let opening = +balances[0]?.opening || 0;
	let totIn = 0;
	let totOut = 0;
	for (const r of movements) {
		const qty = +r.qty || 0;
		const date = String(r.date);
		if (date < p.from) {
			opening += qty;
			continue;
		}
		if (qty > 0) totIn += qty;
		else totOut += -qty;
		rows.push({ date, no: String(r.no).trim(), label: String(r.label).trim(), qty, bal: 0 });
	}
	let balance = opening;
	for (const row of rows) row.bal = (balance += row.qty);
	return {
		ready,
		item: { id: String(product.id).trim(), code: String(product.code).trim(), name: String(product.name).trim(), unit: String(product.unit), price: +product.price || 0 },
		opening,
		rows,
		totIn,
		totOut,
		closing: opening + totIn - totOut
	};
}
