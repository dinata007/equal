import { db } from '../db.svelte';
import { stockBalance, unitCost } from '../ledger';
import type { Doc, FieldDef, JournalLine, LineField, LinesDef, TxDef } from '../types';

/* ---------- helper ---------- */
const amount = (l: Record<string, any>) =>
	(Number(l.qty) || 0) * (Number(l.price) || 0) * (1 - (Number(l.disc) || 0) / 100);

const itemCol = (label = 'Item'): LineField => ({ key: 'itemId', label, type: 'item', required: true, width: 'min-w-64' });
const unitCol: LineField = { key: 'unit', label: 'Sat', type: 'text', readonly: true, width: 'min-w-20' };
const qtyCol: LineField = { key: 'qty', label: 'Qty', type: 'number', required: true, width: 'min-w-24' };

function priced(itemTable: 'raw_materials' | 'products', priceKey: string, label?: string): LinesDef {
	return {
		itemTable,
		itemLabel: label,
		fields: [
			itemCol(label),
			unitCol,
			qtyCol,
			{ key: 'price', label: 'Harga', type: 'money', width: 'min-w-32' },
			{ key: 'disc', label: 'Disc %', type: 'number', width: 'min-w-20' },
			{ key: 'amount', label: 'Jumlah', type: 'computed', format: 'money', compute: amount, width: 'min-w-36' }
		],
		amount,
		onItem: (l, it) => {
			l.unit = it.unit;
			l.price = it[priceKey] ?? 0;
		}
	};
}
function qtyOnly(itemTable: 'raw_materials' | 'products', label?: string): LinesDef {
	return {
		itemTable,
		itemLabel: label,
		fields: [itemCol(label), unitCol, qtyCol, { key: 'note', label: 'Keterangan', type: 'text', width: 'min-w-40' }],
		onItem: (l, it) => (l.unit = it.unit)
	};
}
const noteLines: LinesDef = {
	fields: [
		{ key: 'desc', label: 'Keterangan', type: 'text', required: true, width: 'min-w-72' },
		{ key: 'amount', label: 'Jumlah', type: 'money', required: true, width: 'min-w-40' }
	],
	amount: (l) => Number(l.amount) || 0
};

/** dokumen sumber yang belum dipakai dokumen lain */
const unused = (table: string) => (src: Doc, form: Doc) =>
	src.status === 'posted' &&
	!db.all<Doc>(table).some((d) => d.sourceId === src.id && d.status !== 'void' && d.id !== form.id);

const copyLine = (l: Record<string, any>) => ({ itemId: l.itemId, unit: l.unit, qty: l.qty, price: l.price, disc: l.disc });

const storeField = (label = 'Toko'): FieldDef => ({
	key: 'storeId',
	label,
	type: 'lookup',
	ref: 'stores',
	required: true,
	default: (c) => c.userStoreId
});
const supplierField: FieldDef = { key: 'supplierId', label: 'Supplier', type: 'lookup', ref: 'suppliers', required: true };
const customerField: FieldDef = { key: 'customerId', label: 'Customer', type: 'lookup', ref: 'customers', required: true };
const expeditionField: FieldDef = { key: 'expeditionId', label: 'Ekspedisi', type: 'lookup', ref: 'expeditions' };

/* ---------- akun kontrol: hanya boleh diisi lewat transaksi yang punya buku pembantunya ---------- */
const CONTROL: Record<string, string> = {
	'1-1300': 'Piutang Usaha diisi lewat transaksi AR',
	'2-1100': 'Hutang Usaha diisi lewat transaksi AP / pembayaran hutang',
	'1-1400': 'Persediaan Bahan Baku diisi lewat transaksi stok',
	'1-1410': 'Persediaan Barang Jadi diisi lewat transaksi stok'
};
/** baris akun tidak boleh memakai akun kontrol, kecuali `allow` */
const noControl = (allow: string[] = []) => (d: Doc) => {
	for (const l of d.lines) {
		const code = db.get('coa', l.coaId)?.code ?? '';
		if (CONTROL[code] && !allow.includes(code)) return `Akun ${code} tidak boleh dipakai di sini: ${CONTROL[code]}`;
	}
	return null;
};
/** pelunasan: semua baris wajib akun kontrol pihaknya agar buku besar = buku pembantu */
const onlyAccount = (code: string, label: string) => (d: Doc) =>
	d.lines.every((l) => db.get('coa', l.coaId)?.code === code) ? null : `${label}: semua baris harus memakai akun ${code} ${db.all('coa').find((c) => c.code === code)?.name ?? ''}`;

/* ---------- jurnal otomatis ---------- */
const J = (code: string, debit: number, credit: number, memo?: string): JournalLine => ({ coa: code, debit, credit, memo });
const net = (d: Doc) => (d.subtotal ?? d.total ?? 0) - (d.discount ?? 0);
const kbCoa = (d: Doc) => db.get('coa', db.get('cashbanks', d.kasbankId)?.coaId)?.code ?? '1-1100';
const lineCoa = (id: string) => db.get('coa', id)?.code ?? id;

/** HPP barang jadi keluar (sign 1: jual → D HPP, K Persediaan; -1: retur jual → kebalikannya) */
function cogsJournal(d: Doc, sign: 1 | -1 = 1): JournalLine[] {
	const cost = d.lines.reduce((s, l) => s + (+l.qty || 0) * unitCost('products', l), 0);
	if (!cost) return [];
	return sign > 0 ? [J('5-1000', cost, 0, 'HPP'), J('1-1410', 0, cost, 'Persediaan')] : [J('1-1410', cost, 0, 'Persediaan'), J('5-1000', 0, cost, 'HPP')];
}
/** Kas/bank penampung penjualan toko: tunai → kas kecil toko, non-tunai → rekening bank operasional */
const posKasbank = (d: Doc) => {
	const kb = db.all('cashbanks');
	const byCoa = (code: string) => kb.find((k) => db.get('coa', k.coaId)?.code === code)?.id;
	return (d.payment === 'Tunai' ? byCoa('1-1110') : byCoa('1-1200')) ?? kb.find((k) => k.type === (d.payment === 'Tunai' ? 'Kas' : 'Bank'))?.id ?? '';
};
const posCoa = (d: Doc) => kbCoa({ ...d, kasbankId: posKasbank(d) });

function purchaseJournal(stockCoa: string) {
	return (d: Doc): JournalLine[] => [
		J(stockCoa, net(d), 0, 'Persediaan'),
		...(d.tax ? [J('1-1500', d.tax, 0, 'PPN Masukan')] : []),
		J('2-1100', 0, d.total ?? 0, db.name('suppliers', d.supplierId))
	];
}

/* ====================== MATERIAL ====================== */
export const matPO: TxDef = {
	kind: 'transaction',
	table: 'mat_po',
	prefix: 'MPO',
	party: { field: 'supplierId', ref: 'suppliers', label: 'Supplier' },
	header: [supplierField, { key: 'deliveryDate', label: 'Tgl Kirim Diharapkan', type: 'date' }, { key: 'termDays', label: 'Termin (hari)', type: 'number', default: 30 }],
	lines: priced('raw_materials', 'price', 'Material'),
	totals: { discount: true, tax: true },
	postLabel: 'Approve',
	statusLabels: { posted: 'Approved' }
};

export const matReceipt: TxDef = {
	kind: 'transaction',
	table: 'mat_receipt',
	prefix: 'MRC',
	party: { field: 'supplierId', ref: 'suppliers', label: 'Supplier' },
	header: [supplierField, { key: 'sjNo', label: 'No. Surat Jalan', required: true }, expeditionField],
	source: {
		table: 'mat_po',
		label: 'Order Pembelian (PO)',
		filter: unused('mat_receipt'),
		header: (s) => ({ supplierId: s.supplierId, discount: s.discount, taxRate: s.taxRate }),
		line: copyLine
	},
	lines: priced('raw_materials', 'price', 'Material'),
	totals: { discount: true, tax: true },
	stock: { itemTable: 'raw_materials', loc: () => 'MAT', qty: (l) => +l.qty },
	ledger: [{ kind: 'ap', partyField: 'supplierId', sign: 1 }],
	journal: purchaseJournal('1-1400'),
	closingScope: 'MAT'
};

/* ====================== INVENTORY ====================== */
export const invPO: TxDef = {
	...matPO,
	table: 'inv_po',
	prefix: 'IPO',
	lines: priced('products', 'buyPrice', 'Produk')
};

export const invReceipt: TxDef = {
	kind: 'transaction',
	table: 'inv_receipt',
	prefix: 'IRC',
	party: { field: 'supplierId', ref: 'suppliers', label: 'Supplier' },
	header: [supplierField, { key: 'sjNo', label: 'No. Surat Jalan', required: true }, expeditionField],
	source: {
		table: 'inv_po',
		label: 'Order Pembelian (PO)',
		filter: unused('inv_receipt'),
		header: (s) => ({ supplierId: s.supplierId, discount: s.discount, taxRate: s.taxRate }),
		line: copyLine
	},
	lines: priced('products', 'buyPrice', 'Produk'),
	totals: { discount: true, tax: true },
	stock: { itemTable: 'products', loc: () => 'INV', qty: (l) => +l.qty },
	ledger: [{ kind: 'ap', partyField: 'supplierId', sign: 1 }],
	journal: purchaseJournal('1-1410'),
	closingScope: 'INV'
};

export const invPurchaseReturn: TxDef = {
	kind: 'transaction',
	table: 'inv_purchase_return',
	prefix: 'IRB',
	party: { field: 'supplierId', ref: 'suppliers', label: 'Supplier' },
	header: [supplierField, { key: 'reason', label: 'Alasan Retur', type: 'select', options: ['Cacat Produksi', 'Salah Kirim', 'Kelebihan Kirim', 'Lainnya'], required: true }, expeditionField],
	lines: priced('products', 'buyPrice', 'Produk'),
	stock: { itemTable: 'products', loc: () => 'INV', qty: (l) => -l.qty },
	ledger: [{ kind: 'ap', partyField: 'supplierId', sign: -1 }],
	journal: (d) => [J('2-1100', d.total ?? 0, 0, db.name('suppliers', d.supplierId)), J('1-1410', 0, d.total ?? 0, 'Retur pembelian')],
	closingScope: 'INV'
};

export const invStoreShipment: TxDef = {
	kind: 'transaction',
	table: 'inv_store_shipment',
	prefix: 'KBT',
	party: { field: 'storeId', ref: 'stores', label: 'Toko Tujuan' },
	header: [{ ...storeField('Toko Tujuan'), default: undefined }, expeditionField, { key: 'driver', label: 'Pengemudi / No. Resi' }],
	lines: qtyOnly('products', 'Produk'),
	stock: { itemTable: 'products', loc: () => 'INV', qty: (l) => -l.qty },
	noAmount: true,
	closingScope: 'INV',
	postLabel: 'Kirim'
};

export const invStoreReturnReceipt: TxDef = {
	kind: 'transaction',
	table: 'inv_store_return_receipt',
	prefix: 'TRT',
	party: { field: 'storeId', ref: 'stores', label: 'Dari Toko' },
	header: [{ ...storeField('Dari Toko'), default: undefined }],
	source: {
		table: 'store_returns',
		label: 'Dokumen Retur Toko',
		filter: unused('inv_store_return_receipt'),
		header: (s) => ({ storeId: s.storeId }),
		line: (l) => ({ itemId: l.itemId, unit: l.unit, qty: l.qty, note: l.note }),
		strictQty: true
	},
	lines: qtyOnly('products', 'Produk'),
	stock: { itemTable: 'products', loc: () => 'INV', qty: (l) => +l.qty },
	noAmount: true,
	closingScope: 'INV'
};

/* ====================== SALES ====================== */
export const salesOrder: TxDef = {
	kind: 'transaction',
	table: 'sales_orders',
	prefix: 'SJL',
	party: { field: 'customerId', ref: 'customers', label: 'Customer' },
	header: [
		{ ...customerField, refFilter: (r) => r.type === 'Corporate' },
		{ key: 'salesman', label: 'Salesman' },
		{ key: 'termDays', label: 'Termin (hari)', type: 'number', default: 30 },
		expeditionField
	],
	lines: priced('products', 'sellPrice', 'Produk'),
	totals: { discount: true },
	stock: { itemTable: 'products', loc: () => 'INV', qty: (l) => -l.qty },
	// pendapatan & piutang diakui saat Faktur Tagihan; HPP saat barang keluar gudang
	journal: (d) => cogsJournal(d),
	closingScope: 'INV'
};

/* ====================== TOKO ====================== */
export const storeReceipt: TxDef = {
	kind: 'transaction',
	table: 'store_receipts',
	prefix: 'TBT',
	party: { field: 'storeId', ref: 'stores', label: 'Toko' },
	header: [storeField(), { key: 'receivedBy', label: 'Diterima Oleh' }],
	source: {
		table: 'inv_store_shipment',
		label: 'Surat Kirim dari Gudang',
		filter: (s, f) => unused('store_receipts')(s, f) && (!f.storeId || s.storeId === f.storeId),
		header: (s) => ({ storeId: s.storeId }),
		line: (l) => ({ itemId: l.itemId, unit: l.unit, qty: l.qty }),
		strictQty: true
	},
	lines: qtyOnly('products', 'Produk'),
	stock: { itemTable: 'products', loc: (d) => 'TOKO:' + d.storeId, qty: (l) => +l.qty },
	noAmount: true,
	closingScope: 'TOKO'
};

export const storeReturn: TxDef = {
	kind: 'transaction',
	table: 'store_returns',
	prefix: 'TRB',
	party: { field: 'storeId', ref: 'stores', label: 'Toko' },
	header: [storeField(), { key: 'reason', label: 'Alasan', type: 'select', options: ['Rusak', 'Slow Moving', 'Salah Kirim', 'Lainnya'], required: true }, expeditionField],
	lines: qtyOnly('products', 'Produk'),
	stock: { itemTable: 'products', loc: (d) => 'TOKO:' + d.storeId, qty: (l) => -l.qty },
	noAmount: true,
	closingScope: 'TOKO',
	postLabel: 'Kirim'
};

export const storeSale: TxDef = {
	kind: 'transaction',
	table: 'store_sales',
	prefix: 'POS',
	party: { field: 'storeId', ref: 'stores', label: 'Toko' },
	header: [
		storeField(),
		{ ...customerField, required: false, default: () => db.all('customers').find((c) => c.code === 'CUS-0001')?.id },
		{ key: 'payment', label: 'Pembayaran', type: 'select', options: ['Tunai', 'Debit', 'Kartu Kredit', 'QRIS', 'Transfer'], default: 'Tunai', required: true },
		{ key: 'bankId', label: 'Bank / EDC', type: 'lookup', ref: 'banks', showIf: (f) => f.payment && f.payment !== 'Tunai' }
	],
	lines: priced('products', 'sellPrice', 'Produk'),
	totals: { discount: true },
	stock: { itemTable: 'products', loc: (d) => 'TOKO:' + d.storeId, qty: (l) => -l.qty },
	cash: { kasbank: posKasbank, sign: 1 },
	journal: (d) => [J(posCoa(d), d.total ?? 0, 0, d.payment), J('4-1000', 0, d.total ?? 0, db.name('stores', d.storeId)), ...cogsJournal(d)],
	closingScope: 'TOKO'
};

export const storeSaleReturn: TxDef = {
	kind: 'transaction',
	table: 'store_sale_returns',
	prefix: 'RPJ',
	party: { field: 'storeId', ref: 'stores', label: 'Toko' },
	header: [storeField(), { ...customerField, required: false }, { key: 'refNo', label: 'No. Struk Asal' }, { key: 'reason', label: 'Alasan', type: 'select', options: ['Ukuran Tidak Sesuai', 'Cacat', 'Lainnya'] }],
	lines: priced('products', 'sellPrice', 'Produk'),
	stock: { itemTable: 'products', loc: (d) => 'TOKO:' + d.storeId, qty: (l) => +l.qty },
	// uang dikembalikan tunai dari kas kecil toko
	cash: { kasbank: (d) => posKasbank({ ...d, payment: 'Tunai' }), sign: -1 },
	journal: (d) => [J('4-1100', d.total ?? 0, 0, 'Retur penjualan'), J(posCoa({ ...d, payment: 'Tunai' }), 0, d.total ?? 0), ...cogsJournal(d, -1)],
	closingScope: 'TOKO'
};

export const stockOpname: TxDef = {
	kind: 'transaction',
	table: 'store_opname',
	prefix: 'SOP',
	party: { field: 'storeId', ref: 'stores', label: 'Toko' },
	header: [storeField(), { key: 'counter', label: 'Petugas Hitung' }],
	lines: {
		itemTable: 'products',
		itemLabel: 'Produk',
		fields: [
			itemCol('Produk'),
			{ key: 'sysQty', label: 'Sistem', type: 'number', readonly: true, width: 'min-w-24' },
			{ key: 'physQty', label: 'Fisik', type: 'number', required: true, width: 'min-w-24' },
			{ key: 'diff', label: 'Selisih', type: 'computed', format: 'number', compute: (l) => (Number(l.physQty) || 0) - (Number(l.sysQty) || 0), width: 'min-w-24' }
		],
		onItem: (l, it, d) => {
			l.sysQty = d.storeId ? stockBalance('products', 'TOKO:' + d.storeId, it.id, d.date, d.id) : 0;
			l.physQty = l.sysQty;
		}
	},
	stock: { itemTable: 'products', loc: (d) => 'TOKO:' + d.storeId, qty: (l) => (Number(l.physQty) || 0) - (Number(l.sysQty) || 0) },
	// qty sistem bisa sudah berubah sejak baris diisi → hitung ulang saat posting
	beforePost: (d) => {
		for (const l of d.lines) if (l.itemId) l.sysQty = d.storeId ? stockBalance('products', 'TOKO:' + d.storeId, l.itemId, d.date, d.id) : 0;
	},
	// selisih kurang → beban lain-lain, selisih lebih → pendapatan lain-lain
	journal: (d) => {
		let lost = 0;
		let found = 0;
		for (const l of d.lines) {
			const v = ((Number(l.physQty) || 0) - (Number(l.sysQty) || 0)) * unitCost('products', l);
			if (v < 0) lost -= v;
			else found += v;
		}
		return [
			...(lost ? [J('6-1600', lost, 0, 'Selisih kurang stok opname'), J('1-1410', 0, lost, 'Persediaan')] : []),
			...(found ? [J('1-1410', found, 0, 'Persediaan'), J('4-2000', 0, found, 'Selisih lebih stok opname')] : [])
		];
	},
	noAmount: true,
	closingScope: 'TOKO',
	postLabel: 'Sesuaikan Stok'
};

/* ====================== AKUNTING ====================== */
export const arInvoice: TxDef = {
	kind: 'transaction',
	table: 'ar_invoices',
	prefix: 'INV',
	party: { field: 'customerId', ref: 'customers', label: 'Customer' },
	header: [customerField, { key: 'dueDate', label: 'Jatuh Tempo', type: 'date', required: true }, { key: 'poCustomer', label: 'No. PO Customer' }],
	source: {
		table: 'sales_orders',
		label: 'Penjualan',
		filter: (s, f) => unused('ar_invoices')(s, f) && (!f.customerId || s.customerId === f.customerId),
		header: (s) => ({ customerId: s.customerId, discount: s.discount }),
		line: copyLine
	},
	lines: priced('products', 'sellPrice', 'Produk'),
	totals: { discount: true, tax: true },
	ledger: [{ kind: 'ar', partyField: 'customerId', sign: 1 }],
	journal: (d) => [
		J('1-1300', d.total ?? 0, 0, db.name('customers', d.customerId)),
		J('4-1000', 0, net(d), 'Penjualan'),
		...(d.tax ? [J('2-1200', 0, d.tax, 'PPN Keluaran')] : [])
	]
};

const arNote = (table: string, prefix: string, sign: 1 | -1): TxDef => ({
	kind: 'transaction',
	table,
	prefix,
	party: { field: 'customerId', ref: 'customers', label: 'Customer' },
	header: [customerField, { key: 'refNo', label: 'Ref. Faktur' }],
	lines: noteLines,
	ledger: [{ kind: 'ar', partyField: 'customerId', sign }],
	journal: (d) =>
		sign > 0
			? [J('1-1300', d.total ?? 0, 0), J('4-2000', 0, d.total ?? 0)]
			: [J('4-1100', d.total ?? 0, 0), J('1-1300', 0, d.total ?? 0)]
});
export const arDebitNote = arNote('ar_debit_notes', 'NDA', 1);
export const arCreditNote = arNote('ar_credit_notes', 'NKA', -1);

const apNote = (table: string, prefix: string, sign: 1 | -1): TxDef => ({
	kind: 'transaction',
	table,
	prefix,
	party: { field: 'supplierId', ref: 'suppliers', label: 'Supplier' },
	header: [supplierField, { key: 'refNo', label: 'Ref. Dokumen' }],
	lines: noteLines,
	ledger: [{ kind: 'ap', partyField: 'supplierId', sign }],
	journal: (d) =>
		sign < 0
			? [J('2-1100', d.total ?? 0, 0), J('4-2000', 0, d.total ?? 0)]
			: [J('6-1600', d.total ?? 0, 0), J('2-1100', 0, d.total ?? 0)]
});
export const apDebitNote = apNote('ap_debit_notes', 'NDH', -1);
export const apCreditNote = apNote('ap_credit_notes', 'NKH', 1);

const cashLines: LinesDef = {
	label: 'Rincian Akun',
	fields: [
		{ key: 'coaId', label: 'Akun', type: 'lookup', ref: 'coa', required: true, width: 'min-w-64' },
		{ key: 'desc', label: 'Keterangan', type: 'text', width: 'min-w-48' },
		{ key: 'amount', label: 'Jumlah', type: 'money', required: true, width: 'min-w-40' }
	],
	amount: (l) => Number(l.amount) || 0
};
const kasbankField: FieldDef = { key: 'kasbankId', label: 'Kas / Bank', type: 'lookup', ref: 'cashbanks', required: true };

export const cashIn: TxDef = {
	kind: 'transaction',
	table: 'cash_in',
	prefix: 'BKM',
	party: { field: 'kasbankId', ref: 'cashbanks', label: 'Kas/Bank' },
	header: [
		kasbankField,
		{ key: 'kind', label: 'Jenis', type: 'select', options: ['Umum', 'Pelunasan Piutang'], default: 'Umum', required: true },
		{ ...customerField, showIf: (f) => f.kind === 'Pelunasan Piutang' },
		{ key: 'from', label: 'Diterima Dari' }
	],
	lines: cashLines,
	cash: { field: 'kasbankId', sign: 1 },
	ledger: [{ kind: 'ar', partyField: 'customerId', sign: -1, when: (d) => d.kind === 'Pelunasan Piutang' }],
	validate: (d) => (d.kind === 'Pelunasan Piutang' ? onlyAccount('1-1300', 'Pelunasan piutang')(d) : noControl()(d)),
	journal: (d) => [J(kbCoa(d), d.total ?? 0, 0, d.from), ...d.lines.map((l) => J(lineCoa(l.coaId), 0, +l.amount || 0, l.desc))]
};

export const cashOut: TxDef = {
	kind: 'transaction',
	table: 'cash_out',
	prefix: 'BKK',
	party: { field: 'kasbankId', ref: 'cashbanks', label: 'Kas/Bank' },
	header: [
		kasbankField,
		{ key: 'kind', label: 'Jenis', type: 'select', options: ['Umum', 'Pembayaran Hutang'], default: 'Umum', required: true },
		{ ...supplierField, showIf: (f) => f.kind === 'Pembayaran Hutang' },
		{ key: 'to', label: 'Dibayar Kepada' }
	],
	lines: cashLines,
	cash: { field: 'kasbankId', sign: -1 },
	ledger: [{ kind: 'ap', partyField: 'supplierId', sign: -1, when: (d) => d.kind === 'Pembayaran Hutang' }],
	validate: (d) => (d.kind === 'Pembayaran Hutang' ? onlyAccount('2-1100', 'Pembayaran hutang')(d) : noControl()(d)),
	journal: (d) => [...d.lines.map((l) => J(lineCoa(l.coaId), +l.amount || 0, 0, l.desc)), J(kbCoa(d), 0, d.total ?? 0, d.to)]
};

const journalLines: LinesDef = {
	label: 'Baris Jurnal',
	fields: [
		{ key: 'coaId', label: 'Akun', type: 'lookup', ref: 'coa', required: true, width: 'min-w-64' },
		{ key: 'desc', label: 'Keterangan', type: 'text', width: 'min-w-48' },
		{ key: 'debit', label: 'Debit', type: 'money', width: 'min-w-36' },
		{ key: 'credit', label: 'Kredit', type: 'money', width: 'min-w-36' }
	],
	amount: (l) => Number(l.debit) || 0
};
export const journal: TxDef = {
	kind: 'transaction',
	table: 'journals',
	prefix: 'JU',
	header: [{ key: 'memo', label: 'Uraian', required: true, span: 2 }],
	lines: journalLines,
	balanced: true,
	validate: noControl(),
	journal: (d) => d.lines.map((l) => J(lineCoa(l.coaId), +l.debit || 0, +l.credit || 0, l.desc))
};
export const journalAdjustment: TxDef = { ...journal, table: 'journal_adjustments', prefix: 'JP', header: [{ key: 'memo', label: 'Uraian Penyesuaian', required: true, span: 2 }] };

/* ====================== HR ====================== */
export const attendance: TxDef = {
	kind: 'transaction',
	table: 'attendance',
	prefix: 'ABS',
	party: { field: 'siteId', ref: 'sites', label: 'Site' },
	header: [{ key: 'siteId', label: 'Site', type: 'lookup', ref: 'sites', required: true }],
	lines: {
		label: 'Daftar Hadir',
		fields: [
			{ key: 'employeeId', label: 'Pegawai', type: 'lookup', ref: 'employees', required: true, width: 'min-w-60' },
			{ key: 'in', label: 'Masuk', type: 'time', width: 'min-w-28' },
			{ key: 'out', label: 'Pulang', type: 'time', width: 'min-w-28' },
			{ key: 'status', label: 'Status', type: 'select', options: ['Hadir', 'Terlambat', 'Sakit', 'Izin', 'Cuti', 'Alpa'], width: 'min-w-32' }
		]
	},
	noAmount: true,
	validate: (d) => {
		const seen = new Set<string>();
		for (const l of d.lines) {
			if (!l.employeeId) continue;
			if (seen.has(l.employeeId)) return `${db.name('employees', l.employeeId)} tercantum lebih dari sekali`;
			seen.add(l.employeeId);
		}
		const dup = db.all<Doc>('attendance').find((x) => x.id !== d.id && x.status !== 'void' && x.siteId === d.siteId && x.date === d.date);
		return dup ? `Absensi ${db.name('sites', d.siteId)} tanggal ini sudah ada (${dup.no})` : null;
	},
	postLabel: 'Kunci'
};

export const leave: TxDef = {
	kind: 'transaction',
	table: 'leaves',
	prefix: 'IZN',
	party: { field: 'employeeId', ref: 'employees', label: 'Pegawai' },
	header: [
		{ key: 'employeeId', label: 'Pegawai', type: 'lookup', ref: 'employees', required: true },
		{ key: 'type', label: 'Jenis Izin', type: 'select', options: ['Izin', 'Sakit', 'Cuti Tahunan', 'Dinas Luar', 'Cuti Melahirkan'], required: true },
		{ key: 'from', label: 'Dari Tanggal', type: 'date', required: true, default: (c) => c.today },
		{ key: 'to', label: 'Sampai Tanggal', type: 'date', required: true, default: (c) => c.today },
		{ key: 'reason', label: 'Alasan', type: 'textarea', span: 2 }
	],
	noAmount: true,
	validate: (d) => (d.from && d.to && d.to < d.from ? 'Tanggal sampai tidak boleh sebelum tanggal dari' : null),
	postLabel: 'Setujui',
	statusLabels: { draft: 'Diajukan', posted: 'Disetujui', void: 'Ditolak' }
};

