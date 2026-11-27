import type { FieldDef, MasterDef } from '../types';

/* ---------- master dari database (tabel lama; key = nama kolom) ---------- */

const aktif = { key: 'flag_aktif', label: 'Aktif', type: 'toggle', default: true, list: true } as const;
const akun = (key: string, label: string): FieldDef => ({ key, label, type: 'lookup', source: 'akun' });

/** SENJA.dbo.M_SUPPLIER — PowerBuilder W_01_M02. Dikelola di aplikasi Senja; di Equal hanya dilihat & dipilih. */
export const supplier: MasterDef = {
	kind: 'master',
	resource: 'supplier',
	readOnly: true,
	codeField: 'supp_id',
	nameField: 'nama',
	activeField: 'flag_aktif',
	columns: ['supp_id', 'nama', 'brand_id', 'alamat', 'kota', 'telp', 'fax', 'npwp', 'coa_ap', 'coa_ar', 'coa_inv', 'flag_aktif'],
	fields: [
		{ key: 'supp_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'brand_id', label: 'Brand', type: 'lookup', source: 'brand', required: true, lockOnEdit: true, list: true, mobile: 'subtitle' },
		{ key: 'nama', label: 'Nama Supplier', required: true, maxLength: 50, list: true, mobile: 'title', span: 2 },
		{ key: 'alamat', label: 'Alamat', type: 'textarea', maxLength: 200, span: 2 },
		{ key: 'kota', label: 'Kota', maxLength: 50, list: true },
		{ key: 'telp', label: 'Telepon', type: 'tel', maxLength: 25, list: true },
		{ key: 'fax', label: 'Fax', type: 'tel', maxLength: 25 },
		{ key: 'npwp', label: 'NPWP', maxLength: 30, list: true },
		akun('coa_ap', 'Akun Hutang'),
		akun('coa_inv', 'Akun Persediaan'),
		aktif,
		akun('coa_ar', 'Akun Piutang')
	]
};

/** dbo.M_TOKO — W_02_M01 */
export const store: MasterDef = {
	kind: 'master',
	resource: 'toko',
	codeField: 'toko_id',
	nameField: 'nama',
	activeField: 'flag_aktif',
	columns: ['toko_id', 'nama', 'alamat', 'kota', 'telp', 'site_id', 'acc_ar', 'acc_disc', 'acc_jual', 'coa_hutang', 'coa_biaya', 'promo', 'flag_aktif'],
	fields: [
		{ key: 'toko_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'nama', label: 'Nama Toko', required: true, maxLength: 50, list: true, mobile: 'title' },
		{ key: 'alamat', label: 'Alamat', type: 'textarea', maxLength: 200, span: 2 },
		{ key: 'kota', label: 'Kota', maxLength: 50, list: true, mobile: 'subtitle' },
		{ key: 'telp', label: 'Telepon', type: 'tel', maxLength: 25, list: true },
		akun('acc_ar', 'Akun Piutang'),
		aktif,
		akun('acc_disc', 'Akun Diskon'),
		akun('acc_jual', 'Akun Penjualan'),
		{ key: 'site_id', label: 'Site', type: 'lookup', source: 'site', list: true },
		akun('coa_hutang', 'Akun Hutang Promo'),
		akun('coa_biaya', 'Akun Biaya'),
		{ key: 'promo', label: 'Promo (%)', type: 'number' }
	]
};

/** dbo.M_CUSTOMER — W_02B_M01. Kunci: site toko + kode (site + tahun + urut). */
export const customer: MasterDef = {
	kind: 'master',
	resource: 'customer',
	codeField: 'cust_id',
	nameField: 'nama',
	activeField: 'flag_aktif',
	sortField: ['site_id', 'cust_id'],
	columns: ['site_id', 'cust_id', 'nama', 'nik', 'alamat', 'pulau', 'wilayah', 'kota', 'kab', 'kab_kota', 'telp', 'rjual', 'grosir', 'flag_aktif'],
	fields: [
		{ key: 'site_id', label: 'Toko', type: 'lookup', source: 'toko-site', required: true, lockOnEdit: true, list: true, mobile: 'subtitle' },
		{ key: 'cust_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta', hint: 'Dibuat otomatis: site + tahun + nomor urut' },
		{ key: 'nama', label: 'Nama Customer', required: true, maxLength: 50, list: true, mobile: 'title', span: 2 },
		{ key: 'alamat', label: 'Alamat', type: 'textarea', maxLength: 200, span: 2 },
		{ key: 'pulau', label: 'Pulau', maxLength: 50 },
		{ key: 'wilayah', label: 'Provinsi', maxLength: 75, list: true },
		{ key: 'kota', label: 'Kota', maxLength: 50, list: true },
		{ key: 'kab', label: 'Kabupaten', maxLength: 75 },
		{ key: 'kab_kota', label: 'Kabupaten/Kota', maxLength: 75 },
		{ key: 'telp', label: 'Telepon', type: 'tel', maxLength: 25, list: true },
		{ key: 'rjual', label: 'Rata-rata Jual', type: 'number' },
		{ key: 'nik', label: 'Pegangan', type: 'lookup', source: 'pegawai', hint: 'Pegawai yang memegang customer ini' },
		{ key: 'grosir', label: 'Grosir', type: 'toggle', list: true },
		aktif,
		akun('acc_ar', 'Akun Piutang'),
		akun('acc_disc', 'Akun Diskon'),
		akun('acc_jual', 'Akun Penjualan')
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
	sortField: 'account_id',
	// grid PB disaring per site & brand (pilihan di atas grid); di sini site & brand jadi kolom
	columns: ['site_id', 'brand_id', 'account_id', 'account_desc', 'flag_dk', 'flag_active', 'flag_alloc', 'flag_cf', 'account_cf', 'flag_cc', 'cc_id', 'ledger_id', 'supp_id', 'pjk'],
	fields: [
		{ key: 'site_id', label: 'Site', type: 'lookup', source: 'site', required: true, lockOnEdit: true, list: true },
		{ key: 'brand_id', label: 'Brand', type: 'lookup', source: 'brand', required: true, lockOnEdit: true, list: true },
		{ key: 'account_id', label: 'Kode Akun', required: true, lockOnEdit: true, maxLength: 15, list: true, mobile: 'meta', placeholder: '11.01.00.000' },
		{ key: 'flag_active', label: 'Aktif', type: 'toggle', default: true, list: true },
		{ key: 'flag_dk', label: 'Saldo Normal', type: 'select', required: true, default: 'D', options: [{ value: 'D', label: 'Debit' }, { value: 'K', label: 'Kredit' }], list: true, mobile: 'subtitle' },
		{ key: 'flag_alloc', label: 'Allocation', type: 'toggle' },
		{ key: 'account_desc', label: 'Nama Akun', required: true, maxLength: 60, list: true, mobile: 'title', span: 2 },
		{ key: 'flag_cf', label: 'Cash Flow', type: 'toggle' },
		{ key: 'account_cf', label: 'Akun Cash Flow', type: 'lookup', source: 'cash-flow', required: true, showIf: (f) => !!f.flag_cf },
		{ key: 'flag_cc', label: 'Cost Center', type: 'toggle' },
		{ key: 'cc_id', label: 'Cost Center ID', type: 'lookup', source: 'cost-center', required: true, showIf: (f) => !!f.flag_cc },
		{ key: 'ledger_id', label: 'Group Ledger', type: 'lookup', source: 'ledger', list: true },
		{ key: 'pjk', label: 'Akun Pajak', type: 'toggle' },
		{ key: 'supp_id', label: 'Supplier / Toko', type: 'lookup', source: 'supp-toko', span: 2 }
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
		{ key: 'currency_id', label: 'Mata Uang', required: true, maxLength: 3, default: 'IDR', list: true },
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

/** atribut produk: hanya dilihat (master Produk di Equal hanya baca) */
const attr = (resource: string, fields: FieldDef[], codeField = fields[0].key): MasterDef => ({
	kind: 'master',
	resource,
	readOnly: true,
	codeField,
	nameField: 'nama',
	activeField: 'flag_aktif',
	fields: [...fields, aktif]
});

/** dbo.M_PRODUK_BRAND — w_m_brand */
export const productBrand = attr('produk-brand', [kodeKetik('brand_id', 1, 'Satu huruf, huruf pertama kode model'), nama()]);
/** dbo.M_PRODUK_GENDER — w_m_gender */
export const productGender = attr('produk-gender', [kodeKetik('gender_id', 1, 'Satu karakter, bagian kode model'), nama()]);
/** dbo.M_PRODUK_DEPT — w_m_dept (grup) */
export const productDeptGroup = attr('produk-grup-dept', [
	kodeKetik('grup_dept', 1, 'Satu huruf, huruf awal kode department'),
	nama(),
	{ key: 'grup_dept2', label: 'Singkatan', maxLength: 5, list: true, mobile: 'subtitle', hint: 'Dipakai menyusun Model Produk' },
	{ key: 'disc', label: 'Diskon (%)', type: 'number', list: true, hint: 'Rasio harga barcode bawaan model: diskon / (100 − diskon)' }
]);
/** dbo.M_PRODUK_DEPT2 — w_m_dept (department per grup: detail dari grup terpilih, pages/produk/Department.svelte) */
export const productDept = attr('produk-dept', [
	{ key: 'dept_id', label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta', hint: 'Otomatis: huruf grup + 3 karakter berurut' },
	{ key: 'grup_dept', label: 'Grup Dept', type: 'lookup', source: 'produk-grup-dept', required: true, lockOnEdit: true },
	nama(),
	singkatan(20)
]);
/** dbo.M_PRODUK_BAHAN — w_m_bahan */
export const productMaterial = attr('produk-bahan', [kodeUrut('bahan_id', 3), nama(), singkatan(20)]);
/** dbo.M_PRODUK_WARNA — w_m_warna */
export const productColor = attr('produk-warna', [kodeKetik('warna_id', 2, 'Dua karakter, bagian kode artikel'), nama()]);
/** dbo.M_PRODUK_SIZE — w_m_size */
export const productSize: MasterDef = {
	...attr('produk-size', [
		kodeKetik('size_id', 2, 'Dua karakter, bagian kode artikel'),
		{ key: 'urut', label: 'Urutan', type: 'number', list: true },
		nama(),
		singkatan(10, 'Nama singkat di label')
	]),
	sortField: ['urut', 'size_id'],
	columns: ['urut', 'size_id', 'nama', 'nama_pendek', 'flag_aktif']
};
/** dbo.M_APLIKASI — w_m_aplikasi */
export const productApplication = attr('produk-aplikasi', [kodeUrut('aps_id', 2), nama(), singkatan(20)]);
/** dbo.M_PRODUK_JENIS — w_m_jenis */
export const productKind = attr('produk-jenis', [kodeUrut('jenis_id', 5), nama(40), singkatan(10)]);
/** dbo.M_PRODUK_TIPE — w_m_tipe (per brand) */
export const productType: MasterDef = {
	...attr('produk-tipe', [{ key: 'brand_id', label: 'Brand', type: 'lookup', source: 'brand', required: true, list: true }, kodeUrut('tipe_id', 2), nama()], 'tipe_id'),
	sortField: 'tipe_id'
};

/** dbo.M_PRODUK_MODEL — W_01_M01_ENTRY. Kode model = brand + gender + dept + bahan + nomor + tahun (2) + huruf bulan. */
export const productModel: MasterDef = {
	kind: 'master',
	resource: 'produk',
	readOnly: true,
	codeField: 'model_id',
	nameField: 'nama',
	// grid W_01_M01 (tabelnya di pages/produk/Produk.svelte)
	columns: ['model_id', 'model_id_lama', 'nama', 'nama_pendek', 'supp_id', 'hgrosir', 'hjual_barcode', 'brand_id', 'gender_id', 'dept_id', 'jenis_id', 'bahan_id', 'aps_id'],
	sortField: 'model_id',
	fields: [
		{ key: 'model_id', label: 'Kode Model', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'brand_id', label: 'Brand', type: 'lookup', source: 'brand', required: true, lockOnEdit: true },
		{ key: 'nama', label: 'Nama', maxLength: 50, span: 2, hint: 'Kosongkan = sama dengan Model Produk' },
		{ key: 'nama_pendek', label: 'Nama Pendek', lockOnEdit: true, maxLength: 25, hint: 'Kosongkan = sama dengan Model Produk' },
		{ key: 'model_produk', label: 'Model Produk', auto: true, maxLength: 25, list: true, mobile: 'title', hint: 'Disusun dari singkatan brand, tahun, dept, bahan, jenis & aplikasi + nomor urut' },
		{ key: 'gender_id', label: 'Gender', type: 'lookup', source: 'produk-gender', required: true, lockOnEdit: true, list: true },
		{ key: 'supp_id', label: 'Supplier', type: 'lookup', source: 'supplier', lockOnEdit: true, refFilter: (r, f) => r.brand === f.brand_id },
		{ key: 'dept_id', label: 'Department', type: 'lookup', source: 'produk-dept', required: true, lockOnEdit: true, list: true },
		{ key: 'bahan_id', label: 'Bahan', type: 'lookup', source: 'produk-bahan', required: true, lockOnEdit: true, list: true },
		{ key: 'tipe_id', label: 'Tipe', type: 'lookup', source: 'produk-tipe', lockOnEdit: true, refFilter: (r, f) => r.brand === f.brand_id },
		{ key: 'aps_id', label: 'Aplikasi', type: 'lookup', source: 'produk-aplikasi', required: true, lockOnEdit: true, list: true },
		{ key: 'jenis_id', label: 'Jenis', type: 'lookup', source: 'produk-jenis', required: true, lockOnEdit: true, list: true },
		{ key: 'nomor', label: 'No. Artikel', lockOnEdit: true, maxLength: 3, placeholder: 'Otomatis', hint: '3 digit; kosongkan untuk nomor berikutnya' },
		{ key: 'period', label: 'Bulan-Tahun', type: 'date', required: true, lockOnEdit: true, default: (c) => c.today, list: true, hint: 'Tahun & bulan menjadi bagian kode model' },
		{ key: 'hbeli', label: 'Harga Beli', type: 'money' },
		{ key: 'hjual', label: 'Harga Jual', type: 'money', list: true },
		{ key: 'hgrosir', label: 'Harga Grosir', type: 'money' },
		{ key: 'pembilang', label: 'Rasio Pembilang', type: 'number' },
		{ key: 'penyebut', label: 'Rasio Penyebut', type: 'number' },
		{ key: 'model_id_lama', label: 'Kode Model Designer', maxLength: 20, list: true },
		{ key: 'hjual_barcode', label: 'Harga Barcode', type: 'money', list: true, hint: 'Grosir + grosir × pembilang / penyebut' },
		{ key: 'mall_barcode', label: 'Harga Mall', type: 'money', hint: 'Kosong = sama dengan Harga Barcode' },
	]
};

/** dbo.M_PRODUK — artikel (SKU) = model × warna × size; dibuat lewat Proses Artikel, diubah seperti W_01_M01_B */
export const productSku: MasterDef = {
	kind: 'master',
	resource: 'produk-artikel',
	readOnly: true,
	codeField: 'produk_id',
	nameField: 'nama',
	fields: [
		{ key: 'produk_id', label: 'Kode Artikel', auto: true, lockOnEdit: true, list: true, mobile: 'meta' },
		{ key: 'warna_id', label: 'Warna', type: 'lookup', source: 'produk-warna', readonly: true, list: true },
		{ key: 'size_id', label: 'Size', type: 'lookup', source: 'produk-size', readonly: true, list: true, mobile: 'subtitle' },
		{ key: 'nama', label: 'Nama', required: true, maxLength: 50, list: true, mobile: 'title', span: 2 },
		{ key: 'nama_pendek', label: 'Nama Pendek', maxLength: 25 },
		{ key: 'hbeli', label: 'Harga Beli', type: 'money', readonly: true },
		{ key: 'hjual', label: 'Harga Jual', type: 'money', readonly: true, list: true },
		{ key: 'hgrosir', label: 'Harga Grosir', type: 'money', readonly: true },
		{ key: 'hjual_barcode', label: 'Harga Barcode', type: 'money', list: true },
		{ key: 'mall_barcode', label: 'Harga Mall', type: 'money', list: true }
	]
};

/** field nama standar master tabel lama */
const namaBahan = (key: string, maxLength: number): FieldDef => ({ key, label: 'Nama', required: true, maxLength, list: true, mobile: 'title', span: 2 });

/* ---------- HR (tabel lama, PowerBuilder W_MS_08, W_100_06, W_100_07 & w_ms_*) ---------- */

const ya = (key: string, label: string): FieldDef => ({ key, label, type: 'toggle', default: true });

/** dbo.M_PEGAWAI — W_MS_08_ENTRY. NIK = SJ + yyMM tanggal masuk + 2 digit urut. Riwayat kontrak: tab Kontrak. */
export const employee: MasterDef = {
	kind: 'master',
	resource: 'pegawai',
	codeField: 'nik',
	nameField: 'nama',
	activeField: 'flag_active',
	sortField: ['divisi_id', 'nama', 'nik'],
	columns: ['nik', 'nama', 'telepon', 'status', 'norek', 'pendidikan', 'jab_id', 'divisi_id', 'group_peg_id', 'shift_id', 'tipe_gaji_id', 'bpjs_rp', 'flag_gaji', 'flag_active'],
	fields: [
		{ key: 'nik', label: 'NIK', auto: true, lockOnEdit: true, list: true, mobile: 'meta', section: 'Data pribadi', hint: 'Otomatis: SJ + tahun & bulan masuk + nomor urut' },
		{ key: 'no_absen', label: 'No. Absen', type: 'number', decimals: 0 },
		{ key: 'nama', label: 'Nama Lengkap', required: true, maxLength: 50, list: true, mobile: 'title', span: 2 },
		{ key: 'alamat', label: 'Alamat', type: 'textarea', maxLength: 200, span: 2 },
		{ key: 'telepon', label: 'Telepon', type: 'tel', maxLength: 30, list: true },
		{ key: 'tgl_lahir', label: 'Tanggal Lahir', type: 'date' },
		{ key: 'tempat_lahir', label: 'Tempat Lahir', maxLength: 50 },
		{ key: 'kelamin', label: 'Jenis Kelamin', type: 'select', options: [{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }], list: true },
		{ key: 'status', label: 'Status Nikah', type: 'lookup', source: 'status-nikah' },
		{ key: 'pendidikan', label: 'Pendidikan', maxLength: 30 },
		{ key: 'jab_id', label: 'Jabatan', type: 'lookup', source: 'jabatan', required: true, list: true, mobile: 'subtitle', section: 'Kepegawaian' },
		{ key: 'divisi_id', label: 'Divisi', type: 'lookup', source: 'divisi', required: true, list: true },
		{ key: 'group_peg_id', label: 'Group Premi', type: 'lookup', source: 'group-pegawai' },
		{ key: 'shift_id', label: 'Shift', type: 'lookup', source: 'shift' },
		{ key: 'norek', label: 'No. Rekening', maxLength: 50, section: 'Gaji & status' },
		{ key: 'bank_rek', label: 'Nama Bank', maxLength: 50 },
		{ key: 'nama_rek', label: 'Atas Nama', maxLength: 50 },
		{ key: 'bpjs_rp', label: 'BPJS (Rp)', type: 'money' },
		ya('flag_gaji', 'Ikut Penggajian'),
		{ ...ya('flag_active', 'Aktif'), list: true },
		{ key: 'tipe_gaji_id', label: 'Tipe Gajian', type: 'lookup', source: 'tipe-gaji' },
		{ key: 'tgl_kontrak_awal', label: 'Tanggal Masuk', type: 'date', required: true, lockOnEdit: true, default: (c) => c.today, list: true, hint: 'Tahun & bulan masuk menjadi bagian NIK' },
		{ key: 'sts_peg', label: 'Status Pegawai', type: 'select', default: 'PKWT', options: ['PKWT', 'Tetap'], list: true },
		{ key: 'no_ktp', label: 'No. KTP', maxLength: 20 },
		{ key: 'nama_dkt', label: 'Nama', maxLength: 50, section: 'Kontak darurat' },
		{ key: 'al_dkt', label: 'Alamat', maxLength: 50 },
		{ key: 'tlp_dkt', label: 'Telepon', type: 'tel', maxLength: 50 },
		{ key: 'hub', label: 'Hubungan', maxLength: 50 }
	]
};

const upah = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'money', ...extra });

/** dbo.M_GAJI_UMR — W_100_07_ENTRY. Upah per hari & jam dihitung dari UMR seperti aplikasi lama. */
export const umr: MasterDef = {
	kind: 'master',
	resource: 'umr',
	codeField: 'periode',
	columns: ['periode', 'umr', 'hari', 'min_telat', 'max_telat', 'pot_absen_telat', 'uang_lembur', 'jam_weekday', 'jam_weekend', 'umr_hari', 'umr_jam', 'umr_hari2', 'umr_jam2', 'umr_hari3', 'umr_jam3', 'umr_hari4', 'umr_jam4'],
	fields: [
		{ key: 'periode', label: 'Periode', type: 'date', required: true, default: (c) => c.today, list: true, mobile: 'title' },
		upah('umr', 'UMR / Bulan', { required: true, list: true, mobile: 'subtitle' }),
		{ key: 'hari', label: 'Total Hari Kerja', type: 'number', decimals: 0, required: true, list: true },
		{ key: 'min_telat', label: 'Telat Minimal (menit)', type: 'number', decimals: 0, section: 'Keterlambatan, lembur & jam kerja' },
		{ key: 'max_telat', label: 'Telat Maksimal (menit)', type: 'number', decimals: 0 },
		upah('pot_absen_telat', 'Potongan Telat'),
		upah('uang_lembur', 'Uang Lembur'),
		{ key: 'jam_weekday', label: 'Jam Kerja Weekday', type: 'number', decimals: 2, list: true },
		{ key: 'jam_weekend', label: 'Jam Kerja Weekend', type: 'number', decimals: 2, list: true },
		upah('umr_hari', 'Upah / Hari Weekday 1', { section: 'Upah per hari & jam', hint: 'UMR ÷ total hari' }),
		upah('umr_jam', 'Upah / Jam Weekday 1', { hint: 'Upah hari ÷ jam kerja' }),
		upah('umr_hari2', 'Upah / Hari Weekend 1'),
		upah('umr_jam2', 'Upah / Jam Weekend 1'),
		upah('umr_hari3', 'Upah / Hari Weekday 2'),
		upah('umr_jam3', 'Upah / Jam Weekday 2'),
		upah('umr_hari4', 'Upah / Hari Weekend 2'),
		upah('umr_jam4', 'Upah / Jam Weekend 2')
	],
	// editchanged W_100_07_ENTRY: semua isian pokok terisi → upah per hari & jam dihitung ulang
	derive: (f) => {
		const [u, h, wd, we] = [f.umr, f.hari, f.jam_weekday, f.jam_weekend].map(Number);
		if (!u || !h || !wd || !we) return;
		const hari = Math.round(u / h);
		Object.assign(f, {
			umr_hari: hari,
			umr_hari2: hari,
			umr_jam: Math.round(hari / wd),
			umr_jam2: Math.round(hari / we),
			umr_jam3: Math.round((Number(f.umr_hari3) || 0) / wd),
			umr_jam4: Math.round((Number(f.umr_hari4) || 0) / we)
		});
	}
};

/** dbo.M_PEGAWAI_TUNJANGAN — W_100_06_ENTRY: gaji total dipecah gapok & premi per bulan/hari/jam */
export const allowance: MasterDef = {
	kind: 'master',
	resource: 'tunjangan',
	codeField: 'nik',
	sortField: 'peg_id',
	columns: ['nik', 'peg_id', 'tgl', 'gaji_total', 'hr', 'per_gapok', 'per_premi', 'jumlah', 'jumlah2', 'hr_gapok', 'hr_premi', 'jam_gapok', 'jam_premi'],
	fields: [
		{ key: 'tgl', label: 'Tanggal', type: 'date', required: true, lockOnEdit: true, default: (c) => c.today, list: true, mobile: 'meta' },
		{ key: 'nik', label: 'NIK', auto: true, lockOnEdit: true, list: true, hint: 'Diambil dari data pegawai' },
		{ key: 'peg_id', label: 'Pegawai', type: 'lookup', source: 'pegawai-id', required: true, lockOnEdit: true, list: true, mobile: 'title', span: 2 },
		upah('umakan', 'Uang Makan', { list: true }),
		upah('gaji_total', 'Gaji Total', { required: true, list: true, mobile: 'subtitle', section: 'Komposisi gaji' }),
		{ key: 'hr', label: 'Hari Kerja', type: 'number', decimals: 0, required: true },
		{ key: 'per_gapok', label: 'Persen Gapok (%)', type: 'number', decimals: 0, required: true },
		{ key: 'per_premi', label: 'Persen Premi (%)', type: 'number', decimals: 0, required: true },
		upah('jumlah', 'Gapok / Bulan', { list: true, section: 'Hasil hitung', hint: 'Gaji total × persen gapok' }),
		upah('jumlah2', 'Premi / Bulan', { list: true }),
		upah('hr_gapok', 'Gapok / Hari'),
		upah('hr_premi', 'Premi / Hari'),
		upah('jam_gapok', 'Gapok / Jam', { hint: 'Per hari ÷ 8 jam' }),
		upah('jam_premi', 'Premi / Jam')
	],
	// editchanged W_100_06_ENTRY: hanya bila hari, persen gapok, persen premi & gaji total terisi
	derive: (f) => {
		const [hr, pg, pp, g] = [f.hr, f.per_gapok, f.per_premi, f.gaji_total].map(Number);
		if (!hr || !pg || !pp || !g) return;
		const gapok = Math.round((g * pg) / 100);
		const premi = Math.round((g * pp) / 100);
		Object.assign(f, {
			jumlah: gapok,
			jumlah2: premi,
			hr_gapok: Math.round(gapok / hr),
			hr_premi: Math.round(premi / hr),
			jam_gapok: Math.round(gapok / hr / 8),
			jam_premi: Math.round(premi / hr / 8)
		});
	}
};

/* atribut pegawai (w_ms_jabatan, w_ms_divisi, w_ms_group_peg, w_ms_shift, w_ms_lembur) */
const kodeDb = (key: string): FieldDef => ({ key, label: 'Kode', auto: true, lockOnEdit: true, list: true, mobile: 'meta' });
/** dbo.M_PEGAWAI_JABATAN */
export const employeePosition: MasterDef = { kind: 'master', resource: 'jabatan', codeField: 'jab_id', nameField: 'jab_desc', fields: [kodeDb('jab_id'), namaBahan('jab_desc', 50)] };
/** dbo.M_DIVISI */
export const employeeDivision: MasterDef = { kind: 'master', resource: 'divisi', codeField: 'divisi_id', nameField: 'divisi_desc', fields: [kodeDb('divisi_id'), namaBahan('divisi_desc', 50)] };
/** dbo.M_PEGAWAI_GROUP: premi hadir per hari */
export const employeeGroup: MasterDef = {
	kind: 'master',
	resource: 'group-pegawai',
	codeField: 'group_peg_id',
	nameField: 'nama',
	fields: [kodeDb('group_peg_id'), namaBahan('nama', 50), upah('premi', 'Premi Hadir', { list: true, mobile: 'subtitle' })]
};
/** dbo.M_PEGAWAI_SHIFT */
export const employeeShift: MasterDef = {
	kind: 'master',
	resource: 'shift',
	codeField: 'shift_id',
	nameField: 'nama',
	activeField: 'flag_aktif',
	sortField: 'nama',
	fields: [
		kodeDb('shift_id'),
		namaBahan('nama', 50),
		{ key: 'jam_masuk', label: 'Masuk Weekday', type: 'time', required: true, list: true, section: 'Jam kerja' },
		{ key: 'jam_keluar', label: 'Keluar Weekday', type: 'time', required: true, list: true },
		{ key: 'jam_masuk2', label: 'Masuk Weekend', type: 'time', list: true },
		{ key: 'jam_keluar2', label: 'Keluar Weekend', type: 'time', list: true },
		aktif
	]
};
/** dbo.M_PEGAWAI_LEMBUR: rentang lama lembur → jam lembur yang dihitung */
export const employeeOvertime: MasterDef = {
	kind: 'master',
	resource: 'lembur',
	codeField: 'lembur_id',
	sortField: 'jam1',
	columns: ['jam1', 'jam2', 'jumlah', 'rp'],
	fields: [
		kodeDb('lembur_id'),
		{ key: 'jumlah', label: 'Dihitung (jam)', type: 'number', decimals: 1, required: true, list: true, mobile: 'subtitle' },
		{ key: 'jam1', label: 'Lama Lembur Dari', type: 'time', required: true, list: true, mobile: 'title' },
		{ key: 'jam2', label: 'Sampai', type: 'time', required: true, list: true },
		upah('rp', 'Nominal (Rp)', { list: true })
	]
};

/** tab menu bertab: master biasa (`def`) atau halaman khusus (`custom`, komponennya dipetakan di pages/master/Atribut.svelte) */
export type AttributeTab = { key: string; label: string } & ({ def: MasterDef } | { custom: 'produk' | 'dept' });

/** tab per menu bertab (pages/master/Atribut.svelte); tab pertama = data utama menu */
export const ATTRIBUTES: Record<string, AttributeTab[]> = {
	// atribut (Brand, Gender, Department, …) tidak ditampilkan sebagai tab; tetap dipakai sebagai pilihan & nama di form model
	produk: [{ key: 'produk', label: 'Produk', custom: 'produk' }],
	pegawai: [
		{ key: 'jabatan', label: 'Jabatan', def: employeePosition },
		{ key: 'divisi', label: 'Divisi', def: employeeDivision },
		{ key: 'group', label: 'Group Premi', def: employeeGroup },
		{ key: 'shift', label: 'Shift', def: employeeShift },
		{ key: 'lembur', label: 'Lembur', def: employeeOvertime }
	]
};
