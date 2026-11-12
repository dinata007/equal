import type { SessionUser } from '#lib/domain/types.ts';
import { AuthError } from './auth/users.ts';
import { request, sql } from './db.ts';

export interface TokoSalesRow {
	id: string;
	documentId: string;
	siteId: string;
	no: string;
	date: string;
	status: 'posted' | 'void';
	lines: [];
	total: number;
	storeId: string;
	customerId: string;
	customerName: string;
	island: string;
	province: string;
	remark: string;
	payment: string;
	paymentType: string;
	bankId: string;
	bankInternal: string;
	norek: string;
	noRef: string;
	dueDate: string;
	paymentStatus: string;
	cash: number;
	debit: number;
	credit: number;
	transfer: number;
	change: number;
	rowNo: number;
	productCode: string;
	productName: string;
	wholesalePrice: number;
	barcodePrice: number;
	qty: number;
	discPct: number;
	subtotalLine: number;
	discountAmount: number;
	totalLine: number;
	wholesaleTotal: number;
	barcodeTotal: number;
}

export interface TokoSalesStore {
	value: string;
	label: string;
}

export interface TokoSalesData {
	rows: TokoSalesRow[];
	stores: TokoSalesStore[];
}

export interface TokoSalesCustomer {
	value: string;
	label: string;
	grosir: boolean;
}

export interface TokoSalesBank {
	value: string;
	label: string;
}

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const PAYMENT_TYPES = new Set(['', 'CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'BOOKING', 'UTANG', 'PACKING', 'BATAL']);

export function assertTokoSalesAccess(user: SessionUser) {
	if (!user.admin && !user.menus.some((m) => m.startsWith('/toko/'))) throw new AuthError('Anda tidak punya akses ke data penjualan', 403);
}

export async function resolveTokoStore(user: SessionUser, selectedStore: unknown) {
	const requestedStore = typeof selectedStore === 'string' ? selectedStore.trim() : '';
	const assignedStore = user.admin ? '' : (user.storeId ?? '');
	if (!user.admin && !assignedStore) throw new AuthError('Akun Anda belum memiliki toko', 403);
	if (assignedStore && requestedStore && requestedStore !== assignedStore) throw new AuthError('Anda tidak punya akses ke toko ini', 403);
	const storeId = assignedStore || requestedStore;
	if (!storeId) throw new AuthError('Toko harus dipilih');
	const store = await (await request())
		.input('store', sql.VarChar(5), storeId)
		.query(`SELECT RTRIM(toko_id) AS storeId, RTRIM(site_id) AS siteId FROM dbo.M_TOKO WHERE RTRIM(toko_id) = @store AND ISNULL(flag_aktif, 1) = 1`);
	const record = store.recordset[0] as { storeId: string; siteId: string } | undefined;
	if (!record) throw new AuthError('Toko tidak ditemukan atau tidak aktif', 404);
	if (!record.siteId) throw new AuthError('Toko belum memiliki site_id untuk transaksi penjualan');
	return { storeId: record.storeId, siteId: record.siteId };
}

export async function tokoPenjualan(user: SessionUser, from: unknown, to: unknown, selectedStore: unknown, selectedPayment: unknown): Promise<TokoSalesData> {
	assertTokoSalesAccess(user);
	if (!isDate(from) || !isDate(to) || from > to || (Date.parse(to) - Date.parse(from)) / 864e5 > 600) throw new AuthError('Rentang tanggal tidak valid');

	const payment = typeof selectedPayment === 'string' ? selectedPayment.toUpperCase() : '';
	if (!PAYMENT_TYPES.has(payment)) throw new AuthError('Tipe pembayaran tidak valid');
	const assignedStore = user.admin ? '' : (user.storeId ?? '');
	const requestedStore = typeof selectedStore === 'string' ? selectedStore.trim() : '';
	if (assignedStore && requestedStore && requestedStore !== assignedStore) throw new AuthError('Anda tidak punya akses ke toko ini', 403);
	const store = assignedStore || requestedStore;

	const req = await request();
	req.input('from', sql.Date, from);
	req.input('to', sql.Date, to);
	req.input('store', sql.VarChar(10), store);
	req.input('storeList', sql.VarChar(10), assignedStore);
	req.input('payment', sql.VarChar(10), payment);
	const result = await req.query(`
		SET NOCOUNT ON;
		WITH Customers AS (
			SELECT RTRIM(site_id) AS site_id, RTRIM(toko_id) AS cust_id, nama, '' AS pulau, '' AS wilayah, '1' AS grosir
			FROM dbo.M_TOKO
			UNION ALL
			SELECT RTRIM(site_id), RTRIM(cust_id), nama, ISNULL(pulau, ''), ISNULL(wilayah, ''), ISNULL(grosir, '0')
			FROM dbo.M_CUSTOMER
			WHERE NOT EXISTS (SELECT 1 FROM dbo.M_TOKO t WHERE RTRIM(t.site_id) = RTRIM(M_CUSTOMER.site_id) AND RTRIM(t.toko_id) = RTRIM(M_CUSTOMER.cust_id))
		)
		SELECT
			RTRIM(a.site_id) + ':' + RTRIM(a.bukti) + ':' + CONVERT(varchar(10), ROW_NUMBER() OVER (PARTITION BY a.site_id, a.bukti ORDER BY b.usrtgl, b.produk_id)) AS id,
			RTRIM(a.site_id) + ':' + RTRIM(a.bukti) AS documentId,
			RTRIM(a.site_id) AS siteId,
			RTRIM(a.bukti) AS no,
			CONVERT(char(10), a.tgl, 23) AS date,
			CAST(CASE WHEN UPPER(ISNULL(a.tipe_bayar, 'BOOKING')) = 'BATAL' THEN 'void' ELSE 'posted' END AS varchar(10)) AS status,
			RTRIM(a.toko_id) AS storeId,
			RTRIM(a.cust_id) AS customerId,
			RTRIM(c.nama) AS customerName,
			RTRIM(c.pulau) AS island,
			RTRIM(c.wilayah) AS province,
			RTRIM(ISNULL(a.remark, '')) AS remark,
			UPPER(ISNULL(a.tipe_bayar, 'BOOKING')) AS paymentType,
			ISNULL(a.payment, 0) AS payment,
			RTRIM(ISNULL(a.bank_id, '')) AS bankId,
			RTRIM(ISNULL(a.bank_internal, '')) AS bankInternal,
			RTRIM(ISNULL(a.norek, '')) AS norek,
			RTRIM(ISNULL(a.no_ref, '')) AS noRef,
			CONVERT(char(10), a.tgl_tempo, 23) AS dueDate,
			RTRIM(ISNULL(a.sts_bayar, 'C')) AS paymentStatus,
			ISNULL(a.cash, 0) AS cash,
			ISNULL(a.debit, 0) AS debit,
			ISNULL(a.credit, 0) AS credit,
			ISNULL(a.transfer, 0) AS transfer,
			ISNULL(a.[change], 0) AS [change],
			ROW_NUMBER() OVER (PARTITION BY a.site_id, a.bukti ORDER BY b.usrtgl, b.produk_id) AS rowNo,
			RTRIM(b.produk_id) AS productCode,
			RTRIM(p.nama) AS productName,
			ISNULL(b.harga, 0) AS wholesalePrice,
			ISNULL(b.harga_barcode, 0) AS barcodePrice,
			ISNULL(b.qty, 0) AS qty,
			ISNULL(b.disc, 0) AS discPct,
			ISNULL(b.subtotal, 0) AS subtotalLine,
			ISNULL(b.disc_rp, 0) AS discountAmount,
			ISNULL(b.total, 0) AS totalLine,
			CASE WHEN c.grosir = '1' THEN ISNULL(b.total, 0) ELSE 0 END AS wholesaleTotal,
			CASE WHEN c.grosir = '1' THEN 0 ELSE ISNULL(b.total, 0) END AS barcodeTotal,
			CAST(0 AS int) AS lines,
			ISNULL(b.total, 0) AS total
		FROM dbo.T_TOKO1 a
		INNER JOIN dbo.T_TOKO2 b ON a.site_id = b.site_id AND a.bukti = b.bukti
		INNER JOIN Customers c ON a.site_id = c.site_id AND a.cust_id = c.cust_id
		INNER JOIN dbo.M_PRODUK p ON b.produk_id = p.produk_id
		WHERE a.tgl >= @from AND a.tgl < DATEADD(DAY, 1, @to)
		  AND a.tipe_trans = 'JUAL'
		  AND (@store = '' OR RTRIM(a.toko_id) = @store)
		  AND (@payment = '' OR UPPER(ISNULL(a.tipe_bayar, 'BOOKING')) = @payment)
		ORDER BY a.tgl ASC, a.bukti DESC, rowNo ASC;

		SELECT RTRIM(toko_id) AS value, RTRIM(nama) AS label
		FROM dbo.M_TOKO
		WHERE ISNULL(flag_aktif, 1) = 1 AND (@storeList = '' OR RTRIM(toko_id) = @storeList)
		ORDER BY nama;`);
	const [rows, stores] = result.recordsets as unknown as [Record<string, any>[], TokoSalesStore[]];
	return {
		rows: rows.map((r) => ({
			...r,
			id: String(r.id),
			documentId: String(r.documentId),
			siteId: String(r.siteId ?? ''),
			no: String(r.no),
			date: String(r.date),
			status: r.status === 'void' ? 'void' : 'posted',
			lines: [],
			total: +r.total || 0,
			storeId: String(r.storeId ?? ''),
			customerId: String(r.customerId ?? ''),
			customerName: String(r.customerName ?? ''),
			island: String(r.island ?? ''),
			province: String(r.province ?? ''),
			remark: String(r.remark ?? ''),
			payment: String(r.paymentType ?? ''),
			paymentType: String(r.paymentType ?? ''),
			bankId: String(r.bankId ?? ''),
			bankInternal: String(r.bankInternal ?? ''),
			norek: String(r.norek ?? ''),
			noRef: String(r.noRef ?? ''),
			dueDate: String(r.dueDate ?? ''),
			paymentStatus: String(r.paymentStatus ?? ''),
			cash: +r.cash || 0,
			debit: +r.debit || 0,
			credit: +r.credit || 0,
			transfer: +r.transfer || 0,
			change: +r.change || 0,
			rowNo: +r.rowNo || 0,
			productCode: String(r.productCode ?? ''),
			productName: String(r.productName ?? ''),
			wholesalePrice: +r.wholesalePrice || 0,
			barcodePrice: +r.barcodePrice || 0,
			qty: +r.qty || 0,
			discPct: +r.discPct || 0,
			subtotalLine: +r.subtotalLine || 0,
			discountAmount: +r.discountAmount || 0,
			totalLine: +r.totalLine || 0,
			wholesaleTotal: +r.wholesaleTotal || 0,
			barcodeTotal: +r.barcodeTotal || 0
		})),
		stores: stores.map((s) => ({ value: String(s.value), label: String(s.label) }))
	};
}
