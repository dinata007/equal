import type { MasterDef } from '../types';

const active = { key: 'active', label: 'Aktif', type: 'toggle', default: true, list: true } as const;

export const rawMaterial: MasterDef = {
	kind: 'master',
	table: 'raw_materials',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Material', required: true, list: true, mobile: 'title', span: 2 },
		{ key: 'category', label: 'Kategori', type: 'select', options: ['Kain', 'Benang', 'Aksesoris', 'Packaging'], list: true, mobile: 'subtitle' },
		{ key: 'unit', label: 'Satuan', type: 'select', options: ['Meter', 'Yard', 'Kg', 'Roll', 'Cone', 'Pcs', 'Lusin', 'Pack'], required: true, list: true },
		{ key: 'price', label: 'Harga Standar', type: 'money', list: true },
		{ key: 'minStock', label: 'Stok Minimum', type: 'number' },
		active
	]
};

export const product: MasterDef = {
	kind: 'master',
	table: 'products',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'barcode', label: 'Barcode', unique: true },
		{ key: 'name', label: 'Nama Produk', required: true, list: true, mobile: 'title', span: 2 },
		{ key: 'category', label: 'Kategori', type: 'select', options: ['Atasan', 'Bawahan', 'Outer', 'Aksesoris'], list: true, mobile: 'subtitle' },
		{ key: 'unit', label: 'Satuan', type: 'select', options: ['Pcs', 'Set', 'Lusin'], default: 'Pcs' },
		{ key: 'buyPrice', label: 'Harga Beli', type: 'money', list: true },
		{ key: 'sellPrice', label: 'Harga Jual', type: 'money', list: true },
		{ key: 'minStock', label: 'Stok Minimum', type: 'number' },
		active
	]
};

export const supplier: MasterDef = {
	kind: 'master',
	table: 'suppliers',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Supplier', required: true, list: true, mobile: 'title' },
		{ key: 'contact', label: 'Kontak', list: true },
		{ key: 'phone', label: 'Telepon', type: 'tel', list: true, mobile: 'subtitle' },
		{ key: 'email', label: 'Email', type: 'email' },
		{ key: 'city', label: 'Kota', list: true },
		{ key: 'npwp', label: 'NPWP' },
		{ key: 'termDays', label: 'Termin (hari)', type: 'number', default: 30 },
		{ key: 'address', label: 'Alamat', type: 'textarea', span: 2 },
		active
	]
};

export const expedition: MasterDef = {
	kind: 'master',
	table: 'expeditions',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Ekspedisi', required: true, list: true, mobile: 'title' },
		{ key: 'service', label: 'Layanan', type: 'select', options: ['Reguler', 'Cargo', 'Express', 'Trucking'], list: true, mobile: 'subtitle' },
		{ key: 'phone', label: 'Telepon', type: 'tel', list: true },
		active
	]
};

export const store: MasterDef = {
	kind: 'master',
	table: 'stores',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Toko', required: true, list: true, mobile: 'title' },
		{ key: 'city', label: 'Kota', list: true, mobile: 'subtitle' },
		{ key: 'phone', label: 'Telepon', type: 'tel' },
		{ key: 'manager', label: 'Kepala Toko', list: true },
		{ key: 'siteId', label: 'Site', type: 'lookup', ref: 'sites' },
		{ key: 'address', label: 'Alamat', type: 'textarea', span: 2 },
		active
	]
};

export const customer: MasterDef = {
	kind: 'master',
	table: 'customers',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Customer', required: true, list: true, mobile: 'title' },
		{ key: 'type', label: 'Tipe', type: 'select', options: ['Retail', 'Member', 'Corporate'], default: 'Retail', list: true, mobile: 'subtitle' },
		{ key: 'phone', label: 'Telepon', type: 'tel', list: true },
		{ key: 'email', label: 'Email', type: 'email' },
		{ key: 'storeId', label: 'Toko Terdaftar', type: 'lookup', ref: 'stores', default: (c) => c.userStoreId },
		{ key: 'creditLimit', label: 'Limit Kredit', type: 'money' },
		{ key: 'address', label: 'Alamat', type: 'textarea', span: 2 },
		active
	]
};

export const bank: MasterDef = {
	kind: 'master',
	table: 'banks',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Bank / Metode', required: true, list: true, mobile: 'title' },
		{ key: 'channel', label: 'Channel', type: 'select', options: ['EDC Debit', 'EDC Kredit', 'QRIS', 'Transfer'], list: true, mobile: 'subtitle' },
		{ key: 'accountNo', label: 'No. Rekening / MID', list: true },
		{ key: 'accountName', label: 'Atas Nama' },
		{ key: 'mdr', label: 'MDR (%)', type: 'number', hint: 'Biaya merchant per transaksi' },
		active
	]
};

export const coa: MasterDef = {
	kind: 'master',
	table: 'coa',
	fields: [
		{ key: 'code', label: 'Kode Akun', required: true, unique: true, list: true, mobile: 'meta', placeholder: '1-1100' },
		{ key: 'name', label: 'Nama Akun', required: true, list: true, mobile: 'title', span: 2 },
		{ key: 'type', label: 'Tipe', type: 'select', required: true, options: ['Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'HPP', 'Beban'], list: true, mobile: 'subtitle' },
		{ key: 'normal', label: 'Saldo Normal', type: 'select', options: ['Debit', 'Kredit'], list: true },
		active
	]
};

export const site: MasterDef = {
	kind: 'master',
	table: 'sites',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Site', required: true, list: true, mobile: 'title' },
		{ key: 'type', label: 'Jenis', type: 'select', options: ['Kantor', 'Gudang', 'Produksi', 'Toko'], list: true, mobile: 'subtitle' },
		{ key: 'city', label: 'Kota', list: true },
		{ key: 'address', label: 'Alamat', type: 'textarea', span: 2 },
		active
	]
};

export const cashBank: MasterDef = {
	kind: 'master',
	table: 'cashbanks',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Kas/Bank', required: true, list: true, mobile: 'title' },
		{ key: 'type', label: 'Tipe', type: 'select', options: ['Kas', 'Bank'], required: true, list: true, mobile: 'subtitle' },
		{ key: 'coaId', label: 'Akun COA', type: 'lookup', ref: 'coa', required: true, refFilter: (r) => r.type === 'Aset' },
		{ key: 'bankName', label: 'Nama Bank', showIf: (f) => f.type === 'Bank' },
		{ key: 'accountNo', label: 'No. Rekening', showIf: (f) => f.type === 'Bank', list: true },
		{ key: 'opening', label: 'Saldo Awal', type: 'money', list: true },
		active
	]
};

export const employee: MasterDef = {
	kind: 'master',
	table: 'employees',
	codeField: 'nik',
	fields: [
		{ key: 'nik', label: 'NIK', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Lengkap', required: true, list: true, mobile: 'title' },
		{ key: 'position', label: 'Jabatan', list: true, mobile: 'subtitle' },
		{ key: 'department', label: 'Departemen', type: 'select', options: ['Produksi', 'Gudang', 'Toko', 'Keuangan', 'HRD', 'Manajemen'], list: true },
		{ key: 'siteId', label: 'Site', type: 'lookup', ref: 'sites', required: true },
		{ key: 'joinDate', label: 'Tanggal Masuk', type: 'date' },
		{ key: 'status', label: 'Status', type: 'select', options: ['Tetap', 'Kontrak', 'Harian'], default: 'Kontrak', list: true },
		{ key: 'baseSalary', label: 'Gaji Pokok', type: 'money' },
		{ key: 'phone', label: 'Telepon', type: 'tel' },
		{ key: 'email', label: 'Email', type: 'email' },
		active
	]
};

export const umr: MasterDef = {
	kind: 'master',
	table: 'umr',
	codeField: 'region',
	nameField: 'region',
	fields: [
		{ key: 'region', label: 'Wilayah (Kab/Kota)', required: true, list: true, mobile: 'title', span: 2 },
		{ key: 'year', label: 'Tahun', type: 'number', required: true, list: true, mobile: 'meta', default: () => new Date().getFullYear() },
		{ key: 'amount', label: 'Nominal UMR', type: 'money', required: true, list: true, mobile: 'subtitle' },
		{ key: 'decree', label: 'No. SK', list: true }
	]
};

export const allowance: MasterDef = {
	kind: 'master',
	table: 'allowances',
	fields: [
		{ key: 'code', label: 'Kode', required: true, unique: true, list: true, mobile: 'meta' },
		{ key: 'name', label: 'Nama Tunjangan', required: true, list: true, mobile: 'title' },
		{ key: 'type', label: 'Sifat', type: 'select', options: ['Tetap', 'Tidak Tetap'], list: true, mobile: 'subtitle' },
		{ key: 'basis', label: 'Dasar Hitung', type: 'select', options: ['Per Bulan', 'Per Hari Hadir', '% Gaji Pokok'], list: true },
		{ key: 'amount', label: 'Nominal / %', type: 'number', list: true },
		active
	]
};

