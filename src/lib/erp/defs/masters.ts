import type { FieldDef, MasterDef } from '../types';

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

/* ---------- master dari database (tabel lama; key = nama kolom) ---------- */

const aktif = { key: 'flag_aktif', label: 'Aktif', type: 'toggle', default: true, list: true } as const;
const akun = (key: string, label: string): FieldDef => ({ key, label, type: 'lookup', source: 'akun' });

/** dbo.M_SUPPLIER — PowerBuilder W_01_M02 */
export const supplier: MasterDef = {
	kind: 'master',
	resource: 'supplier',
	codeField: 'supp_id',
	nameField: 'nama',
	activeField: 'flag_aktif',
	fields: [
		{ key: 'supp_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'brand_id', label: 'Brand', type: 'lookup', source: 'brand', required: true, lockOnEdit: true, list: true, mobile: 'subtitle' },
		{ key: 'nama', label: 'Nama Supplier', required: true, maxLength: 50, list: true, mobile: 'title', span: 2 },
		{ key: 'kota', label: 'Kota', maxLength: 50, list: true },
		{ key: 'telp', label: 'Telepon', type: 'tel', maxLength: 25, list: true },
		{ key: 'fax', label: 'Fax', type: 'tel', maxLength: 25 },
		{ key: 'npwp', label: 'NPWP', maxLength: 30, list: true },
		{ key: 'alamat', label: 'Alamat', type: 'textarea', maxLength: 200, span: 2 },
		akun('coa_inv', 'Akun Persediaan'),
		akun('coa_ap', 'Akun Hutang'),
		akun('coa_ar', 'Akun Piutang'),
		aktif
	]
};

/** dbo.M_EKSPEDISI — W_01_M03 */
export const expedition: MasterDef = {
	kind: 'master',
	resource: 'ekspedisi',
	codeField: 'ekspedisi_id',
	nameField: 'nama',
	activeField: 'flag_aktif',
	fields: [
		{ key: 'ekspedisi_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'nama', label: 'Nama Ekspedisi', required: true, maxLength: 50, list: true, mobile: 'title' },
		{ key: 'kota', label: 'Kota', maxLength: 50, list: true, mobile: 'subtitle' },
		{ key: 'telp', label: 'Telepon', type: 'tel', maxLength: 25, list: true },
		{ key: 'alamat', label: 'Alamat', type: 'textarea', maxLength: 200, span: 2 },
		aktif
	]
};

/** dbo.M_TOKO — W_02_M01 */
export const store: MasterDef = {
	kind: 'master',
	resource: 'toko',
	codeField: 'toko_id',
	nameField: 'nama',
	activeField: 'flag_aktif',
	fields: [
		{ key: 'toko_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'nama', label: 'Nama Toko', required: true, maxLength: 50, list: true, mobile: 'title' },
		{ key: 'site_id', label: 'Site', type: 'lookup', source: 'site', list: true },
		{ key: 'kota', label: 'Kota', maxLength: 50, list: true, mobile: 'subtitle' },
		{ key: 'telp', label: 'Telepon', type: 'tel', maxLength: 25, list: true },
		{ key: 'promo', label: 'Promo (%)', type: 'number' },
		{ key: 'alamat', label: 'Alamat', type: 'textarea', maxLength: 200, span: 2 },
		akun('acc_ar', 'Akun Piutang'),
		akun('acc_jual', 'Akun Penjualan'),
		akun('acc_disc', 'Akun Diskon'),
		akun('coa_hutang', 'Akun Hutang Promo'),
		akun('coa_biaya', 'Akun Biaya'),
		aktif
	]
};

/** dbo.M_CUSTOMER — W_02B_M01. Kunci: site toko + kode (site + tahun + urut). */
export const customer: MasterDef = {
	kind: 'master',
	resource: 'customer',
	codeField: 'cust_id',
	nameField: 'nama',
	activeField: 'flag_aktif',
	fields: [
		{ key: 'cust_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta', hint: 'Dibuat otomatis: site + tahun + nomor urut' },
		{ key: 'site_id', label: 'Toko', type: 'lookup', source: 'toko-site', required: true, lockOnEdit: true, list: true, mobile: 'subtitle' },
		{ key: 'nama', label: 'Nama Customer', required: true, maxLength: 50, list: true, mobile: 'title', span: 2 },
		{ key: 'telp', label: 'Telepon', type: 'tel', maxLength: 25, list: true },
		{ key: 'nik', label: 'Pegangan', type: 'lookup', source: 'pegawai', hint: 'Pegawai yang memegang customer ini' },
		{ key: 'alamat', label: 'Alamat', type: 'textarea', maxLength: 200, span: 2 },
		{ key: 'kota', label: 'Kota', maxLength: 50, list: true },
		{ key: 'kab', label: 'Kabupaten', maxLength: 75 },
		{ key: 'kab_kota', label: 'Kabupaten/Kota', maxLength: 75 },
		{ key: 'wilayah', label: 'Provinsi', maxLength: 75, list: true },
		{ key: 'pulau', label: 'Pulau', maxLength: 50 },
		{ key: 'rjual', label: 'Rata-rata Jual', type: 'number' },
		{ key: 'grosir', label: 'Grosir', type: 'toggle', list: true },
		akun('acc_ar', 'Akun Piutang'),
		akun('acc_jual', 'Akun Penjualan'),
		akun('acc_disc', 'Akun Diskon'),
		aktif
	]
};

/** dbo.M_BANK — W_02B_M02 */
export const bank: MasterDef = {
	kind: 'master',
	resource: 'bank',
	codeField: 'bank_id',
	nameField: 'bank_desc',
	activeField: 'flag_aktif',
	fields: [
		{ key: 'bank_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'bank_desc', label: 'Nama Bank', required: true, maxLength: 128, list: true, mobile: 'title', span: 2 },
		aktif
	]
};

/** dbo.gl_coa — W_GL_01. Kunci: site + akun + brand. */
export const coa: MasterDef = {
	kind: 'master',
	resource: 'coa',
	codeField: 'account_id',
	nameField: 'account_desc',
	activeField: 'flag_active',
	fields: [
		{ key: 'account_id', label: 'Kode Akun', required: true, lockOnEdit: true, maxLength: 15, list: true, mobile: 'meta', placeholder: '11.01.00.000' },
		{ key: 'account_desc', label: 'Nama Akun', required: true, maxLength: 60, list: true, mobile: 'title', span: 2 },
		{ key: 'site_id', label: 'Site', type: 'lookup', source: 'site', required: true, lockOnEdit: true, list: true },
		{ key: 'brand_id', label: 'Brand', type: 'lookup', source: 'brand', required: true, lockOnEdit: true, list: true },
		{ key: 'flag_dk', label: 'Saldo Normal', type: 'select', required: true, default: 'D', options: [{ value: 'D', label: 'Debit' }, { value: 'K', label: 'Kredit' }], list: true, mobile: 'subtitle' },
		{ key: 'ledger_id', label: 'Group Ledger', type: 'lookup', source: 'ledger', list: true },
		{ key: 'supp_id', label: 'Supplier / Toko', type: 'lookup', source: 'supp-toko', span: 2 },
		{ key: 'flag_cf', label: 'Cash Flow', type: 'toggle' },
		{ key: 'account_cf', label: 'Akun Cash Flow', type: 'lookup', source: 'cash-flow', required: true, showIf: (f) => !!f.flag_cf },
		{ key: 'flag_cc', label: 'Cost Center', type: 'toggle' },
		{ key: 'cc_id', label: 'Cost Center', type: 'lookup', source: 'cost-center', required: true, showIf: (f) => !!f.flag_cc },
		{ key: 'flag_alloc', label: 'Allocation', type: 'toggle' },
		{ key: 'pjk', label: 'Akun Pajak', type: 'toggle' },
		{ key: 'flag_active', label: 'Aktif', type: 'toggle', default: true, list: true }
	]
};

/** dbo.gl_site — W_GL_01_T_01 */
export const site: MasterDef = {
	kind: 'master',
	resource: 'site',
	codeField: 'site_id',
	nameField: 'long_desc',
	fields: [
		{ key: 'site_id', label: 'Kode Site', required: true, lockOnEdit: true, maxLength: 4, list: true, mobile: 'meta' },
		{ key: 'long_desc', label: 'Nama Site', required: true, maxLength: 50, list: true, mobile: 'title' },
		{ key: 'short_desc', label: 'Nama Singkat', maxLength: 15, list: true, mobile: 'subtitle' }
	]
};

/** dbo.cb_master — W_CB_01. Kunci: site + kode + brand. */
export const cashBank: MasterDef = {
	kind: 'master',
	resource: 'kas-bank',
	codeField: 'kd_bank',
	nameField: 'nm_bank',
	fields: [
		{ key: 'site_id', label: 'Site', type: 'lookup', source: 'site', required: true, lockOnEdit: true, list: true },
		{ key: 'kd_bank', label: 'Kode', required: true, lockOnEdit: true, maxLength: 3, list: true, mobile: 'meta' },
		{ key: 'brand_id', label: 'Brand', type: 'lookup', source: 'brand', required: true, lockOnEdit: true, list: true },
		{ key: 'nm_bank', label: 'Keterangan', required: true, maxLength: 50, list: true, mobile: 'title', span: 2 },
		{ key: 'bank_type', label: 'Tipe', type: 'select', required: true, default: 'K', options: [{ value: 'K', label: 'Buku Kas' }, { value: 'B', label: 'Buku Bank' }], list: true, mobile: 'subtitle' },
		{ key: 'currency_id', label: 'Mata Uang', required: true, maxLength: 3, default: 'IDR' },
		{ key: 'account_id', label: 'Akun G/L', type: 'lookup', source: 'akun-site', required: true, list: true, refFilter: (r, f) => r.site === f.site_id, hint: 'Akun COA di site yang sama' },
		{ key: 'kas_kecil', label: 'Kas Kecil', type: 'toggle', list: true }
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

