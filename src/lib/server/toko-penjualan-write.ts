import type { SessionUser } from '#lib/domain/types.ts';
import { legacyUser } from './master/service.ts';
import { AuthError } from './auth/users.ts';
import { getPool, request, sql } from './db.ts';
import { assertTokoSalesAccess, resolveTokoStore, type TokoSalesBank, type TokoSalesCustomer } from './toko-penjualan.ts';
import { audit } from './auth/audit.ts';

type SalesLineInput = {
	productId: string;
	qty: number;
	price?: number;
	barcodePrice?: number;
	discPct?: number;
};

type SalesInput = {
	storeId: string;
	customerId: string;
	date: string;
	remark?: string;
	lines: SalesLineInput[];
	payment: {
		type: string;
		bankId?: string;
		bankInternal?: string;
		norek?: string;
		noRef?: string;
		dueDate?: string;
		status?: string;
		cash?: number;
		debit?: number;
		credit?: number;
		transfer?: number;
	};
};

const isDate = (value: unknown): value is string => {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const amount = (value: unknown, name: string) => {
	const n = Number(value ?? 0);
	if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000_000) throw new AuthError(`${name} tidak valid`);
	return Math.round(n);
};
const PAYMENT_TYPES = new Set(['CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'BOOKING', 'UTANG', 'PACKING', 'BATAL']);

async function writeAccess(user: SessionUser, storeId: unknown) {
	if (!user.admin && !user.menus.includes('/toko/transaksi/penjualan')) throw new AuthError('Anda tidak punya akses untuk mengubah penjualan', 403);
	return resolveTokoStore(user, storeId);
}

export async function tokoPenjualanOptions(user: SessionUser, selectedStore: unknown) {
	const store = await writeAccess(user, selectedStore);
	const req = await request();
	req.input('site', sql.VarChar(5), store.siteId);
	const result = await req.query(`
		SELECT RTRIM(toko_id) AS value, RTRIM(nama) AS label, CAST(1 AS bit) AS grosir
		FROM dbo.M_TOKO
		WHERE RTRIM(site_id) = @site AND ISNULL(flag_aktif, 1) = 1
		UNION ALL
		SELECT RTRIM(c.cust_id), RTRIM(c.nama), CAST(ISNULL(c.grosir, 0) AS bit)
		FROM dbo.M_CUSTOMER c
		WHERE RTRIM(c.site_id) = @site AND ISNULL(c.flag_aktif, 1) = 1
		  AND NOT EXISTS (SELECT 1 FROM dbo.M_TOKO t WHERE RTRIM(t.site_id)=@site AND RTRIM(t.toko_id)=RTRIM(c.cust_id))
		ORDER BY label;
		SELECT RTRIM(bank_id) AS value, RTRIM(bank_desc) AS label
		FROM dbo.M_BANK WHERE ISNULL(flag_aktif, 1) = 1 ORDER BY bank_desc;`);
	const [customers, banks] = result.recordsets as unknown as [TokoSalesCustomer[], TokoSalesBank[]];
	return {
		store,
		customers: customers.map((customer) => ({
			value: String(customer.value),
			label: String(customer.label),
			grosir: !!customer.grosir
		})),
		banks: banks.map((bank) => ({ value: String(bank.value), label: String(bank.label) }))
	};
}

export async function tokoPenjualanProduct(user: SessionUser, selectedStore: unknown, customerId: unknown, productId: unknown) {
	const store = await writeAccess(user, selectedStore);
	const customer = text(customerId, 10);
	const code = text(productId, 20);
	if (!customer || !code) throw new AuthError('Customer dan ID artikel harus diisi');
	const req = await request();
	req.input('site', sql.VarChar(5), store.siteId).input('customer', sql.VarChar(10), customer).input('product', sql.VarChar(20), code);
	const result = await req.query(`
		SELECT TOP (1) CAST(1 AS bit) AS grosir FROM dbo.M_TOKO
		WHERE RTRIM(site_id) = @site AND RTRIM(toko_id) = @customer AND ISNULL(flag_aktif, 1) = 1
		UNION ALL
		SELECT TOP (1) CAST(ISNULL(grosir, 0) AS bit) AS grosir FROM dbo.M_CUSTOMER c
		WHERE RTRIM(site_id) = @site AND RTRIM(cust_id) = @customer AND ISNULL(flag_aktif, 1) = 1
		  AND NOT EXISTS (SELECT 1 FROM dbo.M_TOKO t WHERE RTRIM(t.site_id)=@site AND RTRIM(t.toko_id)=@customer);
		SELECT RTRIM(produk_id) AS productId, RTRIM(nama) AS name, ISNULL(hbeli, 0) AS cost,
			ISNULL(hgrosir, 0) AS wholesalePrice, ISNULL(hjual_barcode, hjual) AS barcodePrice
		FROM dbo.M_PRODUK WHERE RTRIM(produk_id) = @product;`);
	const [customers, products] = result.recordsets as unknown as [Record<string, unknown>[], Record<string, unknown>[]];
	if (!customers[0]) throw new AuthError('Customer tidak ditemukan atau tidak aktif', 404);
	const product = products[0];
	if (!product) throw new AuthError('Artikel tidak ditemukan', 404);
	const isWholesale = !!customers[0].grosir;
	const wholesalePrice = Number(product.wholesalePrice) || 0;
	const barcodePrice = Number(product.barcodePrice) || 0;
	return {
		productId: String(product.productId),
		name: String(product.name),
		cost: Number(product.cost) || 0,
		price: isWholesale ? wholesalePrice : barcodePrice,
		wholesalePrice,
		barcodePrice
	};
}

function readInput(value: unknown, editing: boolean): SalesInput {
	if (!value || typeof value !== 'object') throw new AuthError('Data transaksi tidak valid');
	const input = value as Record<string, unknown>;
	if (!isDate(input.date)) throw new AuthError('Tanggal transaksi tidak valid');
	const customerId = text(input.customerId, 10);
	const storeId = text(input.storeId, 5);
	if (!customerId || !storeId) throw new AuthError('Toko dan customer harus diisi');
	if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 200) throw new AuthError('Transaksi harus berisi 1 sampai 200 artikel');
	const lines = input.lines.map((value) => {
		if (!value || typeof value !== 'object') throw new AuthError('Detail artikel tidak valid');
		const line = value as Record<string, unknown>;
		const productId = text(line.productId, 20);
		const qty = amount(line.qty, 'Qty');
		const discPct = Number(line.discPct ?? 0);
		if (!productId || qty <= 0 || !Number.isFinite(discPct) || discPct < 0 || discPct > 100) throw new AuthError('ID artikel, qty, atau diskon tidak valid');
		return {
			productId,
			qty,
			price: line.price == null ? undefined : amount(line.price, 'Harga'),
			barcodePrice: line.barcodePrice == null ? undefined : amount(line.barcodePrice, 'Harga barcode'),
			discPct
		};
	});
	if (new Set(lines.map((line) => line.productId)).size !== lines.length) throw new AuthError('ID artikel yang sama tidak boleh dimasukkan lebih dari sekali');
	const payment = input.payment && typeof input.payment === 'object' ? (input.payment as Record<string, unknown>) : {};
	const type = text(payment.type, 10).toUpperCase();
	if (!PAYMENT_TYPES.has(type)) throw new AuthError('Tipe pembayaran tidak valid');
	if (type === 'BATAL' && !editing) throw new AuthError('Transaksi baru tidak dapat disimpan sebagai BATAL');
	const dueDate = payment.dueDate == null || payment.dueDate === '' ? '' : String(payment.dueDate);
	if (dueDate && !isDate(dueDate)) throw new AuthError('Tanggal tempo tidak valid');
	if ((type === 'UTANG' || type === 'TRANSFER') && !dueDate) throw new AuthError('Tanggal tempo wajib diisi untuk UTANG dan TRANSFER');
	const bankId = text(payment.bankId, 5);
	if (['DEBIT', 'CREDIT', 'TRANSFER'].includes(type) && !bankId) throw new AuthError('Bank wajib dipilih untuk tipe pembayaran ini');
	return {
		storeId,
		customerId,
		date: input.date,
		remark: text(input.remark, 50),
		lines,
		payment: {
			type,
			bankId,
			bankInternal: text(payment.bankInternal, 5),
			norek: text(payment.norek, 30),
			noRef: text(payment.noRef, 30),
			dueDate,
			status: payment.status === 'T' ? 'T' : 'C',
			cash: amount(payment.cash, 'Tunai'),
			debit: amount(payment.debit, 'Debit'),
			credit: amount(payment.credit, 'Kredit'),
			transfer: amount(payment.transfer, 'Transfer')
		}
	};
}

async function checkDate(transaction: sql.Transaction, date: string) {
	const result = await transaction.request().query(`SELECT CONVERT(char(10), GETDATE(), 23) AS today`);
	const today = String(result.recordset[0]?.today ?? '');
	if (!today || date > today) throw new AuthError('Tanggal transaksi tidak boleh di masa depan');
	const delta = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`);
	if (delta > 7 * 864e5) throw new AuthError('Tanggal transaksi tidak boleh lebih dari 7 hari yang lalu');
	return today;
}

async function getCustomer(transaction: sql.Transaction, siteId: string, customerId: string) {
	const result = await transaction
		.request()
		.input('site', sql.VarChar(5), siteId)
		.input('customer', sql.VarChar(10), customerId)
		.query(`
			SELECT TOP (1) CAST(ISNULL(grosir, 0) AS bit) AS grosir FROM dbo.M_CUSTOMER
			WHERE RTRIM(site_id) = @site AND RTRIM(cust_id) = @customer AND ISNULL(flag_aktif, 1) = 1
			UNION ALL
			SELECT TOP (1) CAST(1 AS bit) FROM dbo.M_TOKO
			WHERE RTRIM(site_id) = @site AND RTRIM(toko_id) = @customer AND ISNULL(flag_aktif, 1) = 1`);
	if (!result.recordset[0]) throw new AuthError('Customer tidak ditemukan atau tidak aktif', 404);
	return !!result.recordset[0].grosir;
}

async function prepareLines(transaction: sql.Transaction, lines: SalesLineInput[], wholesale: boolean) {
	let rawSubtotal = 0;
	let rawDiscount = 0;
	let rawTotal = 0;
	const prepared = [];
	for (const line of lines) {
		const result = await transaction
			.request()
			.input('product', sql.VarChar(20), line.productId)
			.query(`SELECT TOP (1) RTRIM(produk_id) AS productId, ISNULL(hbeli, 0) AS cost, ISNULL(hgrosir, 0) AS wholesalePrice, ISNULL(hjual_barcode, hjual) AS barcodePrice FROM dbo.M_PRODUK WHERE RTRIM(produk_id) = @product`);
		const product = result.recordset[0];
		if (!product) throw new AuthError(`Artikel ${line.productId} tidak ditemukan`, 404);
		const wholesalePrice = Number(product.wholesalePrice) || 0;
		const barcodePrice = Number(product.barcodePrice) || 0;
		const price = line.price ?? (wholesale ? wholesalePrice : barcodePrice);
		const qty = line.qty;
		const exactSubtotal = price * qty;
		const exactDiscount = exactSubtotal * (line.discPct ?? 0) / 100;
		const exactTotal = exactSubtotal - exactDiscount;
		const lineSubtotal = Math.round(exactSubtotal);
		const lineDiscount = Math.round(exactDiscount);
		const total = Math.round(exactTotal);
		rawSubtotal += exactSubtotal;
		rawDiscount += exactDiscount;
		rawTotal += exactTotal;
		if (!Number.isSafeInteger(total) || total < 0 || total > 999_999_999_999_999 || rawSubtotal > 999_999_999_999_999) {
			throw new AuthError('Nilai transaksi melebihi batas database');
		}
		prepared.push({
			productId: String(product.productId),
			price,
			barcodePrice: line.barcodePrice ?? barcodePrice,
			cost: Number(product.cost) || 0,
			qty,
			subtotal: lineSubtotal,
			discPct: line.discPct ?? 0,
			discount: lineDiscount,
			discountPerPiece: Math.round(exactDiscount / qty),
			total
		});
	}
	return {
		lines: prepared,
		subtotal: Math.round(rawSubtotal),
		discount: Math.round(rawDiscount),
		total: Math.round(rawTotal)
	};
}

async function checkBank(transaction: sql.Transaction, bankId: string) {
	if (!bankId) return;
	const result = await transaction
		.request()
		.input('bank', sql.VarChar(5), bankId)
		.query(`SELECT TOP (1) bank_id FROM dbo.M_BANK WHERE RTRIM(bank_id) = @bank AND ISNULL(flag_aktif, 1) = 1`);
	if (!result.recordset[0]) throw new AuthError('Bank tidak ditemukan atau tidak aktif', 404);
}

async function checkBankInternal(transaction: sql.Transaction, bankInternal: string) {
	if (!bankInternal) return;
	const result = await transaction
		.request()
		.input('bankInternal', sql.VarChar(5), bankInternal)
		.query(`SELECT TOP (1) bank_id FROM dbo.M_REKENING WHERE RTRIM(bank_id)=@bankInternal AND ISNULL(flag_aktif, 1)=1`);
	if (!result.recordset[0]) throw new AuthError('Bank internal tidak ditemukan atau tidak aktif', 404);
}

async function updateDocument(user: SessionUser, raw: unknown, documentId?: string) {
	const input = readInput(raw, !!documentId);
	const store = await writeAccess(user, input.storeId);
	const username = (await legacyUser(user)).slice(0, 15);
	const transaction = new sql.Transaction(await getPool());
	await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
	try {
		const today = await checkDate(transaction, input.date);
		const customerWholesale = await getCustomer(transaction, store.siteId, input.customerId);
		const totals = await prepareLines(transaction, input.lines, customerWholesale);
		const payment = input.payment;
		await checkBank(transaction, payment.bankId ?? '');
		await checkBankInternal(transaction, payment.bankInternal ?? '');
		const paymentTotal = (payment.cash ?? 0) + (payment.debit ?? 0) + (payment.credit ?? 0);
		const change = paymentTotal - totals.total;
		let bukti = '';
		if (documentId) {
			const [siteId, ...parts] = documentId.split(':');
			bukti = parts.join(':');
			if (siteId !== store.siteId || !bukti) throw new AuthError('Dokumen tidak ditemukan atau di luar toko Anda', 404);
			const current = await transaction
				.request()
				.input('site', sql.VarChar(5), store.siteId)
				.input('bukti', sql.VarChar(15), bukti)
				.input('store', sql.VarChar(5), store.storeId)
				.query(`
					SELECT TOP (1) a.tipe_trans, a.tipe_bayar,
						CASE WHEN EXISTS (SELECT 1 FROM dbo.T_PAYMENT p WHERE p.site_id=a.site_id AND p.bukti_ref=a.bukti) THEN 1 ELSE 0 END AS hasPayments
					FROM dbo.T_TOKO1 a WITH (UPDLOCK, HOLDLOCK)
					WHERE a.site_id = @site AND a.bukti = @bukti AND a.toko_id = @store AND a.tipe_trans='JUAL'`);
			if (!current.recordset[0]) throw new AuthError('Dokumen tidak ditemukan atau di luar toko Anda', 404);
			if (String(current.recordset[0].tipe_bayar ?? '').toUpperCase() === 'BATAL') throw new AuthError('Transaksi BATAL tidak dapat diedit');
			if (Number(current.recordset[0].hasPayments)) throw new AuthError('Transaksi yang sudah memiliki pembayaran tercatat tidak dapat diedit');
		} else {
			const prefix = `TJ${store.siteId}${today.slice(2, 4)}${today.slice(5, 7)}`;
			const next = await transaction
				.request()
				.input('prefix', sql.VarChar(11), prefix)
				.query(`SELECT ISNULL(MAX(TRY_CONVERT(int, RIGHT(bukti, 4))), 0) + 1 AS nextNo FROM dbo.T_TOKO1 WITH (UPDLOCK, HOLDLOCK) WHERE LEFT(bukti, LEN(@prefix)) = @prefix`);
			const serial = Number(next.recordset[0]?.nextNo);
			if (!Number.isInteger(serial) || serial < 1 || serial > 9999) throw new AuthError('Nomor bukti untuk periode ini sudah mencapai batas');
			bukti = `${prefix}${String(serial).padStart(4, '0')}`;
		}

		const request = transaction.request();
		request
			.input('site', sql.VarChar(5), store.siteId)
			.input('bukti', sql.VarChar(15), bukti)
			.input('store', sql.VarChar(5), store.storeId)
			.input('customer', sql.VarChar(10), input.customerId)
			.input('date', sql.DateTime, new Date(`${input.date}T00:00:00`))
			.input('remark', sql.VarChar(50), input.remark)
			.input('grosir', sql.Bit, customerWholesale)
			.input('subtotal', sql.Decimal(15, 0), totals.subtotal)
			.input('discount', sql.Decimal(15, 0), totals.discount)
			.input('total', sql.Decimal(15, 0), totals.total)
			.input('paymentType', sql.VarChar(10), payment.type)
			.input('bank', sql.VarChar(5), payment.bankId || null)
			.input('bankInternal', sql.VarChar(5), payment.bankInternal || null)
			.input('norek', sql.VarChar(30), payment.norek || null)
			.input('noRef', sql.VarChar(30), payment.noRef || null)
			.input('dueDate', sql.SmallDateTime, payment.dueDate ? new Date(`${payment.dueDate}T00:00:00`) : null)
			.input('paymentStatus', sql.VarChar(1), payment.status)
			.input('cash', sql.Decimal(15, 0), payment.cash)
			.input('debit', sql.Decimal(15, 0), payment.debit)
			.input('credit', sql.Decimal(15, 0), payment.credit)
			.input('transfer', sql.Decimal(15, 0), payment.transfer)
			.input('payment', sql.Decimal(15, 0), paymentTotal)
			.input('change', sql.Decimal(15, 0), change)
			.input('username', sql.VarChar(15), username);
		if (documentId) {
			const updated = await request.query(`
				UPDATE dbo.T_TOKO1 SET tgl=@date, cust_id=@customer, grosir=@grosir, remark=@remark,
					subtotal=@subtotal, disc=0, disc_rp=@discount, total=@total, tipe_bayar=@paymentType,
					bank_id=@bank, bank_internal=@bankInternal, norek=@norek, no_ref=@noRef, tgl_tempo=@dueDate,
					sts_bayar=@paymentStatus, cash=@cash, debit=@debit, credit=@credit, transfer=@transfer,
					payment=@payment, [change]=@change, usrupd=@username, tglupd=GETDATE()
				WHERE site_id=@site AND bukti=@bukti AND toko_id=@store AND tipe_trans='JUAL'`);
			if (!updated.rowsAffected.some((count) => count === 1)) throw new AuthError('Transaksi tidak berubah karena sudah diperbarui atau dihapus pengguna lain', 409);
			await transaction.request().input('site', sql.VarChar(5), store.siteId).input('bukti', sql.VarChar(15), bukti)
				.query(`DELETE FROM dbo.T_TOKO2 WHERE site_id=@site AND bukti=@bukti`);
		} else {
			await request.query(`
				INSERT INTO dbo.T_TOKO1
					(site_id, bukti, tgl, cust_id, grosir, tipe_trans, status, toko_id, remark, subtotal, disc, disc_rp,
					 total, payment, tipe_bayar, bank_id, bank_internal, norek, tgl_tempo, sts_bayar, cash, debit,
					 credit, [change], usrupd, tglupd, no_ref, transfer)
				VALUES
					(@site, @bukti, @date, @customer, @grosir, 'JUAL', 'OUT', @store, @remark, @subtotal, 0, @discount,
					 @total, @payment, @paymentType, @bank, @bankInternal, @norek, @dueDate, @paymentStatus, @cash, @debit,
					 @credit, @change, @username, GETDATE(), @noRef, @transfer)`);
		}
		for (const line of totals.lines) {
			await transaction
				.request()
				.input('site', sql.VarChar(5), store.siteId)
				.input('bukti', sql.VarChar(15), bukti)
				.input('product', sql.VarChar(20), line.productId)
				.input('price', sql.Decimal(15, 0), line.price)
				.input('barcodePrice', sql.Decimal(15, 0), line.barcodePrice)
				.input('cost', sql.Decimal(15, 0), line.cost)
				.input('qty', sql.Decimal(15, 0), line.qty)
				.input('subtotal', sql.Decimal(15, 0), line.subtotal)
				.input('discPct', sql.Decimal(10, 2), line.discPct)
				.input('discount', sql.Decimal(15, 0), line.discount)
				.input('discountPerPiece', sql.Decimal(15, 0), line.discountPerPiece)
				.input('total', sql.Decimal(15, 0), line.total)
				.input('username', sql.VarChar(15), username)
				.input('date', sql.DateTime, new Date(`${input.date}T00:00:00`))
				.query(`
					INSERT INTO dbo.T_TOKO2
						(site_id, bukti, produk_id, harga, harga_barcode, harga_beli, qty, subtotal, disc, disc_rp, total, usrtgl, usrupd, disc_rp_pcs, tgl)
					VALUES (@site, @bukti, @product, @price, @barcodePrice, @cost, @qty, @subtotal, @discPct, @discount, @total, GETDATE(), @username, @discountPerPiece, @date)`);
		}
		await transaction.commit();
		await audit(documentId ? 'toko.penjualan.update' : 'toko.penjualan.create', {
			userId: user.id,
			username: user.username,
			detail: `${store.siteId}:${bukti}`
		});
		return { documentId: `${store.siteId}:${bukti}`, no: bukti };
	} catch (error) {
		await transaction.rollback();
		throw error;
	}
}

export async function createTokoPenjualan(user: SessionUser, raw: unknown) {
	return updateDocument(user, raw);
}

export async function editTokoPenjualan(user: SessionUser, documentId: string, raw: unknown) {
	return updateDocument(user, raw, documentId);
}

export async function deleteTokoPenjualan(user: SessionUser, selectedStore: unknown, documentId: string) {
	assertTokoSalesAccess(user);
	if (!user.admin) throw new AuthError('Hanya admin yang boleh menghapus penjualan', 403);
	const store = await resolveTokoStore(user, selectedStore);
	const [siteId, ...parts] = documentId.split(':');
	const bukti = parts.join(':');
	if (siteId !== store.siteId || !bukti) throw new AuthError('Dokumen tidak ditemukan atau di luar toko ini', 404);
	const transaction = new sql.Transaction(await getPool());
	await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
	try {
		const result = await transaction
			.request()
			.input('site', sql.VarChar(5), store.siteId)
			.input('bukti', sql.VarChar(15), bukti)
			.input('store', sql.VarChar(5), store.storeId)
			.query(`
				DELETE FROM dbo.T_TOKO1
				WHERE site_id=@site AND bukti=@bukti AND toko_id=@store AND tipe_trans='JUAL'
				  AND UPPER(ISNULL(tipe_bayar, 'BOOKING'))='BOOKING'
				  AND NOT EXISTS (SELECT 1 FROM dbo.T_PAYMENT p WHERE p.site_id=@site AND p.bukti_ref=@bukti)`);
		if (!result.rowsAffected.some((count) => count === 1)) throw new AuthError('Hanya transaksi BOOKING yang dapat dihapus');
		await transaction.commit();
		await audit('toko.penjualan.delete', { userId: user.id, username: user.username, detail: documentId });
	} catch (error) {
		await transaction.rollback();
		throw error;
	}
}
