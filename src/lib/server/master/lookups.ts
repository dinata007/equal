/**
 * Daftar pilihan (lookup) dari tabel lama untuk isian form: hanya kode, nama & atribut filter —
 * boleh dibaca semua pengguna yang login (data rinci tetap butuh hak menu). Mengikuti dropdown
 * DataWindow PowerBuilder (dddw_*) yang dipakai form aslinya.
 *
 * Setiap SQL mengembalikan kolom: id, code, name, hint, active (+ atribut tambahan, mis. site / brand).
 */
export interface LookupDef {
	sql: string;
	/** kolom hasil berisi brand → disaring sesuai cakupan brand pengguna; `open`: '%' / kosong = semua brand */
	brand?: { column: string; open?: boolean };
}

const yes = (col: string) => `CAST(CASE WHEN ${col} = 'Y' THEN 1 ELSE 0 END AS bit)`;
const bit = (col: string) => `CAST(ISNULL(${col}, 0) AS bit)`;

export const LOOKUPS: Record<string, LookupDef> = {
	brand: {
		sql: `SELECT RTRIM(brand_id) AS id, RTRIM(brand_id) AS code, nama AS name, NULL AS hint, ${bit('flag_aktif')} AS active, RTRIM(brand_id) AS brand
			FROM dbo.M_PRODUK_BRAND`,
		brand: { column: 'brand' }
	},
	site: {
		sql: `SELECT RTRIM(site_id) AS id, RTRIM(site_id) AS code, long_desc AS name, short_desc AS hint, CAST(1 AS bit) AS active FROM dbo.gl_site`
	},
	// dddw_toko: customer disimpan per site toko
	'toko-site': {
		sql: `SELECT id, code, name, hint, active, brand FROM (
				SELECT RTRIM(site_id) AS id, RTRIM(toko_id) AS code, nama AS name, kota AS hint, ${bit('flag_aktif')} AS active, RTRIM(brand_id) AS brand,
					ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY toko_id) AS rn
				FROM dbo.M_TOKO WHERE NULLIF(RTRIM(site_id), '') IS NOT NULL) t
			WHERE rn = 1`,
		brand: { column: 'brand', open: true }
	},
	toko: {
		sql: `SELECT RTRIM(toko_id) AS id, RTRIM(toko_id) AS code, nama AS name, kota AS hint, ${bit('flag_aktif')} AS active, RTRIM(brand_id) AS brand, RTRIM(site_id) AS site
			FROM dbo.M_TOKO`,
		brand: { column: 'brand', open: true }
	},
	// akun COA unik lintas site/brand (kolom acc_*/coa_* di master lain hanya menyimpan kode akun)
	akun: {
		sql: `SELECT RTRIM(account_id) AS id, RTRIM(account_id) AS code, MAX(account_desc) AS name, NULL AS hint,
				CAST(MAX(CASE WHEN flag_active = 'Y' THEN 1 ELSE 0 END) AS bit) AS active
			FROM dbo.gl_coa GROUP BY RTRIM(account_id)`
	},
	'akun-site': {
		sql: `SELECT RTRIM(account_id) AS id, RTRIM(account_id) AS code, MAX(account_desc) AS name, NULL AS hint,
				CAST(MAX(CASE WHEN flag_active = 'Y' THEN 1 ELSE 0 END) AS bit) AS active, RTRIM(site_id) AS site
			FROM dbo.gl_coa GROUP BY RTRIM(site_id), RTRIM(account_id)`
	},
	ledger: {
		sql: `SELECT RTRIM(ledger_id) AS id, RTRIM(ledger_id) AS code, ledger_desc AS name,
				CASE flag_dk WHEN 'D' THEN 'Debit' WHEN 'K' THEN 'Kredit' END AS hint, ${yes('flag_active')} AS active
			FROM dbo.gl_ledger`
	},
	'cash-flow': {
		sql: `SELECT RTRIM(cf_id) AS id, RTRIM(cf_id) AS code, MAX(cf_desc) AS name, NULL AS hint, CAST(1 AS bit) AS active
			FROM dbo.gl_cf WHERE ISNULL(cf_header, 'N') = 'N' GROUP BY RTRIM(cf_id)`
	},
	'cost-center': {
		sql: `SELECT RTRIM(cc_id) AS id, RTRIM(cc_id) AS code, MAX(cc_desc) AS name, NULL AS hint, CAST(1 AS bit) AS active
			FROM dbo.gl_cc GROUP BY RTRIM(cc_id)`
	},
	// dddw_supp_toko: supplier (kode terkecil per nama) + toko
	'supp-toko': {
		sql: `SELECT MIN(RTRIM(supp_id)) AS id, MIN(RTRIM(supp_id)) AS code, nama AS name, 'Supplier' AS hint, CAST(MAX(CAST(ISNULL(flag_aktif, 0) AS int)) AS bit) AS active
				FROM dbo.M_SUPPLIER GROUP BY nama
			UNION ALL
			SELECT RTRIM(toko_id), RTRIM(toko_id), nama, 'Toko', ${bit('flag_aktif')} FROM dbo.M_TOKO`
	},
	supplier: {
		sql: `SELECT RTRIM(supp_id) AS id, RTRIM(supp_id) AS code, nama AS name, kota AS hint, ${bit('flag_aktif')} AS active, RTRIM(brand_id) AS brand
			FROM dbo.M_SUPPLIER`,
		brand: { column: 'brand' }
	},
	ekspedisi: {
		sql: `SELECT RTRIM(ekspedisi_id) AS id, RTRIM(ekspedisi_id) AS code, nama AS name, kota AS hint, ${bit('flag_aktif')} AS active FROM dbo.M_EKSPEDISI`
	},
	bank: {
		sql: `SELECT RTRIM(bank_id) AS id, RTRIM(bank_id) AS code, bank_desc AS name, NULL AS hint, ${bit('flag_aktif')} AS active FROM dbo.M_BANK`
	},
	/* ---- atribut produk (dddw_* form model W_01_M01_ENTRY) ---- */
	'produk-gender': {
		sql: `SELECT RTRIM(gender_id) AS id, RTRIM(gender_id) AS code, nama AS name, NULL AS hint, ${bit('flag_aktif')} AS active FROM dbo.M_PRODUK_GENDER`
	},
	// disc = diskon bawaan rasio harga barcode model
	'produk-grup-dept': {
		sql: `SELECT RTRIM(grup_dept) AS id, RTRIM(grup_dept) AS code, nama AS name, RTRIM(grup_dept2) AS hint, ${bit('flag_aktif')} AS active, disc
			FROM dbo.M_PRODUK_DEPT`
	},
	'produk-dept': {
		sql: `SELECT RTRIM(d.dept_id) AS id, RTRIM(d.dept_id) AS code, d.nama AS name, g.nama AS hint, ${bit('d.flag_aktif')} AS active, RTRIM(d.grup_dept) AS grup,
				RTRIM(d.nama_pendek) AS short
			FROM dbo.M_PRODUK_DEPT2 d LEFT JOIN dbo.M_PRODUK_DEPT g ON g.grup_dept = d.grup_dept`
	},
	'produk-bahan': {
		sql: `SELECT RTRIM(bahan_id) AS id, RTRIM(bahan_id) AS code, nama AS name, RTRIM(nama_pendek) AS hint, ${bit('flag_aktif')} AS active FROM dbo.M_PRODUK_BAHAN`
	},
	'produk-warna': {
		sql: `SELECT RTRIM(warna_id) AS id, RTRIM(warna_id) AS code, nama AS name, NULL AS hint, ${bit('flag_aktif')} AS active FROM dbo.M_PRODUK_WARNA`
	},
	'produk-size': {
		sql: `SELECT RTRIM(size_id) AS id, RTRIM(size_id) AS code, nama AS name, RTRIM(nama_pendek) AS hint, ${bit('flag_aktif')} AS active, urut
			FROM dbo.M_PRODUK_SIZE`
	},
	'produk-aplikasi': {
		sql: `SELECT RTRIM(aps_id) AS id, RTRIM(aps_id) AS code, nama AS name, RTRIM(nama_pendek) AS hint, ${bit('flag_aktif')} AS active FROM dbo.M_APLIKASI`
	},
	'produk-jenis': {
		sql: `SELECT RTRIM(jenis_id) AS id, RTRIM(jenis_id) AS code, nama AS name, RTRIM(nama_pendek) AS hint, ${bit('flag_aktif')} AS active FROM dbo.M_PRODUK_JENIS`
	},
	// dddw_tipe: tipe per brand
	'produk-tipe': {
		sql: `SELECT RTRIM(tipe_id) AS id, RTRIM(tipe_id) AS code, nama AS name, RTRIM(brand_id) AS hint, ${bit('flag_aktif')} AS active, RTRIM(brand_id) AS brand
			FROM dbo.M_PRODUK_TIPE`,
		brand: { column: 'brand' }
	},
	'sls-tipe': {
		sql: `SELECT RTRIM(sls_tipe) AS id, RTRIM(sls_tipe) AS code, nama AS name, NULL AS hint, CAST(1 AS bit) AS active FROM dbo.M_PRODUK_SLS_TIPE`
	},
	// dddw_pegawai: customer menyimpan NIK pegawai pegangan
	pegawai: {
		sql: `SELECT RTRIM(nik) AS id, RTRIM(nik) AS code, nama AS name, NULL AS hint, ${yes('flag_active')} AS active
			FROM dbo.M_PEGAWAI WHERE NULLIF(RTRIM(nik), '') IS NOT NULL`
	}
};

export const lookupOf = (name: string): LookupDef | undefined => (Object.hasOwn(LOOKUPS, name) ? LOOKUPS[name] : undefined);
