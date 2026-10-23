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

/* ---------- produk (tabel lama, PowerBuilder W_01_M01 & w_m_*) ---------- */

/** kode diketik, atau kosong = nomor berikutnya (aplikasi lama: diketik bebas, kodenya selalu angka berurut) */
const kodeUrut = (key: string, maxLength: number): FieldDef => ({
	key,
	label: 'Kode',
	lockOnEdit: true,
	maxLength,
	list: true,
	mobile: 'meta',
	placeholder: 'Otomatis',
	hint: 'Kosongkan untuk nomor berikutnya'
});
const kodeKetik = (key: string, maxLength: number, hint?: string): FieldDef => ({ key, label: 'Kode', required: true, lockOnEdit: true, maxLength, list: true, mobile: 'meta', hint });
const nama = (maxLength = 50): FieldDef => ({ key: 'nama', label: 'Nama', required: true, maxLength, list: true, mobile: 'title', span: 2 });
const singkatan = (maxLength: number, hint = 'Dipakai menyusun Model Produk'): FieldDef => ({ key: 'nama_pendek', label: 'Singkatan', maxLength, list: true, mobile: 'subtitle', hint });

const attr = (resource: string, fields: FieldDef[], codeField = fields[0].key): MasterDef => ({
	kind: 'master',
	resource,
	codeField,
	nameField: 'nama',
	activeField: 'flag_aktif',
	fields: [...fields, aktif]
});

/** dbo.M_PRODUK_BRAND — w_m_brand */
export const productBrand = attr('produk-brand', [kodeKetik('brand_id', 1, 'Satu huruf, huruf pertama kode model'), nama(), akun('coa_inv', 'Akun Persediaan')]);
/** dbo.M_PRODUK_GENDER — w_m_gender */
export const productGender = attr('produk-gender', [kodeKetik('gender_id', 1, 'Satu karakter, bagian kode model'), nama()]);
/** dbo.M_PRODUK_DEPT — w_m_dept (grup) */
export const productDeptGroup = attr('produk-grup-dept', [
	kodeKetik('grup_dept', 1, 'Satu huruf, huruf awal kode department'),
	nama(),
	{ key: 'grup_dept2', label: 'Singkatan', maxLength: 5, list: true, mobile: 'subtitle', hint: 'Dipakai menyusun Model Produk' },
	{ key: 'disc', label: 'Diskon (%)', type: 'number', list: true, hint: 'Rasio harga barcode bawaan model: diskon / (100 − diskon)' }
]);
/** dbo.M_PRODUK_DEPT2 — w_m_dept (department per grup) */
export const productDept = attr('produk-dept', [
	{ key: 'dept_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta', hint: 'Otomatis: huruf grup + 3 karakter berurut' },
	{ key: 'grup_dept', label: 'Grup Dept', type: 'lookup', source: 'produk-grup-dept', required: true, lockOnEdit: true, list: true },
	nama(),
	singkatan(20)
]);
/** dbo.M_PRODUK_BAHAN — w_m_bahan */
export const productMaterial = attr('produk-bahan', [kodeUrut('bahan_id', 3), nama(), singkatan(20)]);
/** dbo.M_PRODUK_WARNA — w_m_warna */
export const productColor = attr('produk-warna', [kodeKetik('warna_id', 2, 'Dua karakter, bagian kode artikel'), nama()]);
/** dbo.M_PRODUK_SIZE — w_m_size */
export const productSize = attr('produk-size', [
	kodeKetik('size_id', 2, 'Dua karakter, bagian kode artikel'),
	nama(),
	singkatan(10, 'Nama singkat di label'),
	{ key: 'urut', label: 'Urutan', type: 'number', list: true }
]);
/** dbo.M_APLIKASI — w_m_aplikasi */
export const productApplication = attr('produk-aplikasi', [kodeUrut('aps_id', 2), nama(), singkatan(20)]);
/** dbo.M_PRODUK_JENIS — w_m_jenis */
export const productKind = attr('produk-jenis', [kodeUrut('jenis_id', 5), nama(40), singkatan(10)]);
/** dbo.M_PRODUK_TIPE — w_m_tipe (per brand) */
export const productType = attr('produk-tipe', [kodeUrut('tipe_id', 2), { key: 'brand_id', label: 'Brand', type: 'lookup', source: 'brand', required: true, list: true }, nama()]);

/** dbo.M_PRODUK_MODEL — W_01_M01_ENTRY. Kode model = brand + gender + dept + bahan + nomor + tahun (2) + huruf bulan. */
export const productModel: MasterDef = {
	kind: 'master',
	resource: 'produk',
	codeField: 'model_id',
	nameField: 'nama',
	activeField: 'flag_aktif',
	fields: [
		{ key: 'model_id', label: 'Kode Model', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'brand_id', label: 'Brand', type: 'lookup', source: 'brand', required: true, lockOnEdit: true },
		{ key: 'gender_id', label: 'Gender', type: 'lookup', source: 'produk-gender', required: true, lockOnEdit: true, list: true },
		{ key: 'dept_id', label: 'Department', type: 'lookup', source: 'produk-dept', required: true, lockOnEdit: true, list: true },
		{ key: 'bahan_id', label: 'Bahan', type: 'lookup', source: 'produk-bahan', required: true, lockOnEdit: true, list: true },
		{ key: 'jenis_id', label: 'Jenis', type: 'lookup', source: 'produk-jenis', required: true, lockOnEdit: true, list: true },
		{ key: 'aps_id', label: 'Aplikasi', type: 'lookup', source: 'produk-aplikasi', required: true, lockOnEdit: true, list: true },
		{ key: 'period', label: 'Bulan-Tahun', type: 'date', required: true, lockOnEdit: true, default: (c) => c.today, list: true, hint: 'Tahun & bulan menjadi bagian kode model' },
		{ key: 'nomor', label: 'No. Artikel', lockOnEdit: true, maxLength: 3, placeholder: 'Otomatis', hint: '3 digit; kosongkan untuk nomor berikutnya' },
		{ key: 'tipe_id', label: 'Tipe', type: 'lookup', source: 'produk-tipe', lockOnEdit: true, refFilter: (r, f) => r.brand === f.brand_id },
		{ key: 'supp_id', label: 'Supplier', type: 'lookup', source: 'supplier', lockOnEdit: true, refFilter: (r, f) => r.brand === f.brand_id },
		{ key: 'model_produk', label: 'Model Produk', auto: true, maxLength: 25, list: true, mobile: 'title', hint: 'Disusun dari singkatan brand, tahun, dept, bahan, jenis & aplikasi + nomor urut' },
		{ key: 'nama', label: 'Nama', maxLength: 50, span: 2, hint: 'Kosongkan = sama dengan Model Produk' },
		{ key: 'nama_pendek', label: 'Nama Pendek', lockOnEdit: true, maxLength: 25, hint: 'Kosongkan = sama dengan Model Produk' },
		{ key: 'nama_pendek2', label: 'Nama Retail', maxLength: 25, list: true, mobile: 'subtitle' },
		{ key: 'model_id_lama', label: 'Kode Model Designer', maxLength: 20, list: true },
		{ key: 'hbeli', label: 'Harga Beli', type: 'money' },
		{ key: 'hjual', label: 'Harga Jual', type: 'money', list: true },
		{ key: 'hgrosir', label: 'Harga Grosir', type: 'money' },
		{ key: 'pembilang', label: 'Rasio Pembilang', type: 'number' },
		{ key: 'penyebut', label: 'Rasio Penyebut', type: 'number' },
		{ key: 'hjual_barcode', label: 'Harga Barcode', type: 'money', list: true, hint: 'Grosir + grosir × pembilang / penyebut' },
		{ key: 'mall_barcode', label: 'Harga Mall', type: 'money', hint: 'Kosong = sama dengan Harga Barcode' },
		{ key: 'prioritas', label: 'Prioritas', type: 'select', default: 'NORMAL', options: ['NORMAL', 'PRIORITAS'] },
		{ key: 'sls_tipe', label: 'Tipe Sales', type: 'lookup', source: 'sls-tipe' },
		aktif
	]
};

/** dbo.M_PRODUK — artikel (SKU) = model × warna × size; dibuat lewat Proses Artikel, diubah seperti W_01_M01_B */
export const productSku: MasterDef = {
	kind: 'master',
	resource: 'produk-artikel',
	codeField: 'produk_id',
	nameField: 'nama',
	fields: [
		{ key: 'produk_id', label: 'Kode Artikel', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'warna_id', label: 'Warna', type: 'lookup', source: 'produk-warna', readonly: true, list: true },
		{ key: 'size_id', label: 'Size', type: 'lookup', source: 'produk-size', readonly: true, list: true, mobile: 'subtitle' },
		{ key: 'nama', label: 'Nama', required: true, maxLength: 50, list: true, mobile: 'title', span: 2 },
		{ key: 'nama_pendek', label: 'Nama Pendek', maxLength: 25 },
		{ key: 'nama_pendek2', label: 'Nama Retail', maxLength: 25, list: true },
		{ key: 'kode_mall', label: 'Kode Mall', maxLength: 20, list: true },
		{ key: 'hbeli', label: 'Harga Beli', type: 'money', readonly: true },
		{ key: 'hjual', label: 'Harga Jual', type: 'money', readonly: true, list: true },
		{ key: 'hgrosir', label: 'Harga Grosir', type: 'money', readonly: true },
		{ key: 'hjual_barcode', label: 'Harga Barcode', type: 'money', list: true },
		{ key: 'mall_barcode', label: 'Harga Mall', type: 'money', list: true }
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

