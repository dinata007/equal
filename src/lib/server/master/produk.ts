/**
 * Master produk dari tabel lama (PowerBuilder W_01_M01 & w_m_*): atribut produk, model (M_PRODUK_MODEL)
 * dan artikel/SKU (M_PRODUK = model × warna × size; dibuat lewat proses artikel, lihat artikel.ts).
 */
import * as M from '#lib/erp/defs/masters.ts';
import { hargaBarcode } from '#lib/erp/produk.ts';
import { AuthError } from '../auth/users.ts';
import { request, sql } from '../db.ts';
import { kodeUrut, letters3, likeEscape } from './codes.ts';
import type { Resource, Values } from './registry.ts';

const ATRIBUT = '/inventory/master/atribut-produk';
const PRODUK_MENU = '/inventory/master/produk';
const stamp = { user: 'usrupd', time: 'usrtgl' };

/** atribut yang tersimpan di model & artikel */
const dipakai = (col: string): [string, string][] => [
	['Model produk', `dbo.M_PRODUK_MODEL WHERE ${col} = @${col}`],
	['Artikel produk', `dbo.M_PRODUK WHERE ${col} = @${col}`]
];


const SKU_TABLES: [string, string][] = [
	['Transaksi toko', 'dbo.T_TOKO2'],
	['Transaksi gudang', 'dbo.T_GUDANG2'],
	['Pembelian barang', 'dbo.T_BELI2'],
	['Kirim barang (GIT)', 'dbo.T_GIT2'],
	['Penjualan', 'dbo.T_JUAL2'],
	['Saldo awal gudang', 'dbo.S_AWAL_GUDANG'],
	['Saldo awal toko', 'dbo.S_AWAL_TOKO'],
	['Stok opname gudang', 'dbo.T_OPNAME'],
	['Stok opname toko', 'dbo.T_OPNAME_TOKO'],
	['Rolling barang', 'dbo.T_ROLLING2'],
	['Sales', 'dbo.T_SALES4'],
	['Pembayaran sales', 'dbo.T_SALES_BYR'],
	['Rencana produksi', 'dbo.T_PRO_PLAN2'],
	['Arsip transaksi toko', 'dbo.T_TOKO2XX'],
	['Arsip transaksi toko', 'dbo.T_TOKOX2'],
	['Arsip transaksi toko', 'dbo.T_TOKOXX2']
];

/** warna produk juga dipakai raw material (W_10_M04 memakai tabel yang sama) */
export const WARNA_DIPAKAI: [string, string][] = [
	['Warna model', 'dbo.M_PRODUK_MODEL2 WHERE warna_id = @warna_id'],
	['Artikel produk', 'dbo.M_PRODUK WHERE warna_id = @warna_id'],
	['Raw material', 'dbo.m_bahan_art WHERE warna_id = @warna_id']
];

const pad = (n: number, w: number) => String(n).padStart(w, '0');

/** W_01_M01_ENTRY pb_save: nomor artikel per brand+gender+dept+bahan & tahun-bulan; kode model; model produk */
async function nextModel(req: () => sql.Request, v: Values) {
	const period = v.period as Date;
	const thbn = String(period.getFullYear()).slice(2) + String.fromCharCode(65 + period.getMonth());
	const dept = String(v.dept_id);
	v.grup_dept = dept.slice(0, 1);
	const key = `${v.brand_id}${v.gender_id}${dept}${v.bahan_id}`;
	if (key.length !== 9) throw new AuthError('Kode brand, gender, department atau bahan tidak sesuai format kode model (1+1+4+3 karakter)');

	if (!v.nomor) {
		const r = await req().input('k', sql.VarChar(9), key).input('t', sql.VarChar(3), thbn).query(`
			SELECT MAX(SUBSTRING(model_id, 10, 3)) AS n FROM dbo.M_PRODUK_MODEL WITH (UPDLOCK, HOLDLOCK)
			WHERE LEFT(model_id, 9) = @k AND SUBSTRING(model_id, 13, 3) = @t`);
		const last = Number(r.recordset[0]?.n);
		let n = !Number.isFinite(last) || last >= 999 ? 1 : last + 1;
		// seperti PB: lompati nomor yang sudah terpakai
		for (let i = 0; i < 999; i++, n = (n % 999) + 1) {
			const used = await req().input('m', sql.VarChar(20), key + pad(n, 3) + thbn).query('SELECT COUNT(*) AS c FROM dbo.M_PRODUK_MODEL WITH (UPDLOCK, HOLDLOCK) WHERE model_id = @m');
			if (!used.recordset[0].c) break;
		}
		v.nomor = pad(n, 3);
	}
	v.model_id = key + v.nomor + thbn;

	// model produk: brand+YY-grup-dept-bahan-jenis-aplikasi + 4 digit urut (singkatan dari master atribut)
	const s = await req()
		.input('g', sql.VarChar(5), v.grup_dept)
		.input('d', sql.VarChar(5), dept)
		.input('b', sql.VarChar(3), v.bahan_id)
		.input('j', sql.VarChar(5), v.jenis_id)
		.input('a', sql.VarChar(2), v.aps_id).query(`
			SELECT (SELECT RTRIM(grup_dept2) FROM dbo.M_PRODUK_DEPT WHERE grup_dept = @g) AS g,
				(SELECT RTRIM(nama_pendek) FROM dbo.M_PRODUK_DEPT2 WHERE dept_id = @d) AS d,
				(SELECT RTRIM(nama_pendek) FROM dbo.M_PRODUK_BAHAN WHERE bahan_id = @b) AS b,
				(SELECT RTRIM(nama_pendek) FROM dbo.M_PRODUK_JENIS WHERE jenis_id = @j) AS j,
				(SELECT RTRIM(nama_pendek) FROM dbo.M_APLIKASI WHERE aps_id = @a) AS a`);
	const x = s.recordset[0];
	const prefix = [`${v.brand_id}${thbn.slice(0, 2)}`, x.g, x.d, x.b, x.j, x.a].map((p) => p ?? '').join('-').slice(0, 21);
	const m = await req().input('p', sql.VarChar(50), likeEscape(prefix)).query(`
		SELECT MAX(TRY_CAST(RIGHT(RTRIM(model_produk), 4) AS int)) AS n FROM dbo.M_PRODUK_MODEL WITH (UPDLOCK, HOLDLOCK)
		WHERE model_produk LIKE @p + '[0-9][0-9][0-9][0-9]'`);
	v.model_produk = prefix + pad((m.recordset[0]?.n ?? 0) + 1, 4);
	v.nama ||= v.model_produk;
	v.nama_pendek ||= v.model_produk;
	v.sls_tgl = period;
}

async function checkModel(req: () => sql.Request, v: Values) {
	for (const k of ['nama', 'nama_pendek', 'nama_pendek2', 'model_produk']) if (typeof v[k] === 'string') v[k] = v[k].toUpperCase();
	// kode model dibuat saat simpan; ada kode = ubah (kolom pembentuk kode terkunci, data lama tidak divalidasi ulang)
	if (!v.model_id) {
		const msg = await checkNewModel(req, v);
		if (msg) return msg;
	}
	if (!v.hjual_barcode) v.hjual_barcode = hargaBarcode(v.hgrosir, v.pembilang, v.penyebut) ?? v.hjual_barcode;
	// pb_save: harga mall kosong = harga barcode
	if (!v.mall_barcode) v.mall_barcode = v.hjual_barcode ?? 0;
	return null;
}

async function checkNewModel(req: () => sql.Request, v: Values) {
	if (v.nomor && !/^\d{3}$/.test(v.nomor)) return 'No. Artikel harus 3 digit angka';
	if (v.tipe_id) {
		const r = await req().input('t', sql.VarChar(2), v.tipe_id).input('b', sql.VarChar(1), v.brand_id).query('SELECT COUNT(*) AS n FROM dbo.M_PRODUK_TIPE WHERE tipe_id = @t AND RTRIM(brand_id) = @b');
		if (!r.recordset[0].n) return `Tipe ${v.tipe_id} bukan tipe brand ${v.brand_id}`;
	}
	if (v.supp_id) {
		const r = await req().input('s', sql.VarChar(5), v.supp_id).input('b', sql.VarChar(1), v.brand_id).query('SELECT COUNT(*) AS n FROM dbo.M_SUPPLIER WHERE supp_id = @s AND RTRIM(brand_id) = @b');
		if (!r.recordset[0].n) return `Supplier ${v.supp_id} bukan supplier brand ${v.brand_id}`;
	}
	// rasio bawaan dari diskon grup dept: pembilang = diskon, penyebut = 100 − diskon
	if (v.pembilang == null && v.penyebut == null && v.dept_id) {
		const r = await req().input('g', sql.VarChar(5), String(v.dept_id).slice(0, 1)).query('SELECT disc FROM dbo.M_PRODUK_DEPT WHERE grup_dept = @g');
		const disc = Number(r.recordset[0]?.disc);
		if (disc > 0 && disc < 100) [v.pembilang, v.penyebut] = [disc, 100 - disc];
	}
	return null;
}

/** w_m_dept: grup + 3 digit berurut; setelah 999 berganti huruf AAA, AAB, … */
async function nextDept(req: () => sql.Request, v: Values) {
	const g = String(v.grup_dept);
	const r = await req().input('g', sql.VarChar(5), g).query(`
		SELECT MAX(RIGHT(RTRIM(dept_id), 3)) AS mx,
			SUM(CASE WHEN RIGHT(RTRIM(dept_id), 3) LIKE '[A-Z][A-Z][A-Z]' THEN 1 ELSE 0 END) AS alpha
		FROM dbo.M_PRODUK_DEPT2 WITH (UPDLOCK, HOLDLOCK) WHERE grup_dept = @g`);
	const { mx, alpha } = r.recordset[0];
	let num = mx == null ? 0 : /^\d{3}$/.test(mx) && mx !== '999' ? Number(mx) + 1 : null;
	let n = alpha ?? 0;
	for (let i = 0; i < 20000; i++) {
		const id = g + (num != null ? pad(num, 3) : letters3(n));
		const used = await req().input('d', sql.VarChar(5), id).query('SELECT COUNT(*) AS c FROM dbo.M_PRODUK_DEPT2 WHERE dept_id = @d');
		if (!used.recordset[0].c) return void (v.dept_id = id);
		if (num != null && num < 999) num++;
		else (num = null), n++;
	}
	throw new AuthError('Kode department untuk grup ini sudah habis');
}

export const PRODUK: Record<string, Resource> = {
	/* ---- atribut produk: satu menu, seperti tombol Brand/Gender/… di window produk PB ---- */
	'produk-brand': {
		def: M.productBrand,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_BRAND',
		keys: ['brand_id'],
		brand: { column: 'brand_id' },
		order: 'brand_id',
		usedIn: [
			...dipakai('brand_id'),
			['Tipe produk', 'dbo.M_PRODUK_TIPE WHERE brand_id = @brand_id'],
			['Supplier', 'dbo.M_SUPPLIER WHERE brand_id = @brand_id'],
			['Toko', 'dbo.M_TOKO WHERE brand_id = @brand_id'],
			['COA', 'dbo.gl_coa WHERE brand_id = @brand_id'],
			['Master kas/bank', 'dbo.cb_master WHERE brand_id = @brand_id']
		]
	},
	'produk-gender': {
		def: M.productGender,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_GENDER',
		keys: ['gender_id'],
		order: 'gender_id',
		stamp,
		usedIn: dipakai('gender_id')
	},
	'produk-grup-dept': {
		def: M.productDeptGroup,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_DEPT',
		keys: ['grup_dept'],
		order: 'grup_dept',
		stamp,
		usedIn: [['Department', 'dbo.M_PRODUK_DEPT2 WHERE grup_dept = @grup_dept'], ...dipakai('grup_dept')]
	},
	'produk-dept': {
		def: M.productDept,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_DEPT2',
		keys: ['grup_dept', 'dept_id'],
		order: 'grup_dept, dept_id',
		stamp,
		next: nextDept,
		usedIn: dipakai('dept_id')
	},
	'produk-bahan': {
		def: M.productMaterial,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_BAHAN',
		keys: ['bahan_id'],
		order: 'bahan_id',
		stamp,
		next: kodeUrut('dbo.M_PRODUK_BAHAN', 'bahan_id', 3),
		usedIn: dipakai('bahan_id')
	},
	'produk-warna': {
		def: M.productColor,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_WARNA',
		keys: ['warna_id'],
		order: 'warna_id',
		stamp,
		usedIn: WARNA_DIPAKAI
	},
	'produk-size': {
		def: M.productSize,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_SIZE',
		keys: ['size_id'],
		order: 'urut, size_id',
		stamp,
		usedIn: [
			['Size model', 'dbo.M_PRODUK_MODEL3 WHERE size_id = @size_id'],
			['Harga per size', 'dbo.M_PRODUK_MODEL_SIZE WHERE size_id = @size_id'],
			['Artikel produk', 'dbo.M_PRODUK WHERE size_id = @size_id']
		]
	},
	'produk-aplikasi': {
		def: M.productApplication,
		menu: ATRIBUT,
		table: 'dbo.M_APLIKASI',
		keys: ['aps_id'],
		order: 'aps_id',
		next: kodeUrut('dbo.M_APLIKASI', 'aps_id', 2),
		usedIn: dipakai('aps_id')
	},
	'produk-jenis': {
		def: M.productKind,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_JENIS',
		keys: ['jenis_id'],
		order: 'jenis_id',
		stamp,
		next: kodeUrut('dbo.M_PRODUK_JENIS', 'jenis_id', 5),
		usedIn: dipakai('jenis_id')
	},
	'produk-tipe': {
		def: M.productType,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_TIPE',
		keys: ['tipe_id'],
		brand: { column: 'brand_id' },
		order: 'brand_id, tipe_id',
		next: kodeUrut('dbo.M_PRODUK_TIPE', 'tipe_id', 2),
		usedIn: dipakai('tipe_id')
	},

	/* ---- model & artikel ---- */
	produk: {
		def: M.productModel,
		menu: PRODUK_MENU,
		table: 'dbo.M_PRODUK_MODEL',
		keys: ['model_id'],
		brand: { column: 'brand_id' },
		order: 'model_id',
		stamp,
		// 33 ribu model: daftar per brand & status seperti window lama, kolom ringkas
		filters: { columns: ['brand_id', 'flag_aktif'] },
		slim: true,
		next: nextModel,
		check: checkModel,
		// pb_save: status aktif model ikut ke semua artikelnya
		afterUpdate: async (req, changed) => {
			if ('flag_aktif' in changed) await req().input('a', sql.Bit, changed.flag_aktif).query('UPDATE dbo.M_PRODUK SET flag_aktif = @a WHERE model_id = @model_id');
		},
		// artikel model dicek dengan daftar kodenya (subquery ke 233 ribu artikel per tabel jauh lebih lambat)
		usedIn: async (req, keys) => {
			const r = await (await request()).input('m', sql.VarChar(20), keys.model_id).query('SELECT produk_id FROM dbo.M_PRODUK WHERE model_id = @m');
			const ids = r.recordset.map((x, i) => (req.input(`sku${i}`, sql.VarChar(20), x.produk_id), `@sku${i}`));
			return [
				...(ids.length ? SKU_TABLES.map(([label, table]): [string, string] => [label, `${table} WHERE produk_id IN (${ids.join(', ')})`]) : []),
				['Pembelian barang', 'dbo.T_BELI1 WHERE model_id = @model_id'],
				['Cetak PO', 'dbo.T_PO_PRINT WHERE model_id = @model_id'],
				['Rencana produksi', 'dbo.T_PRO_PLAN1 WHERE model_id = @model_id'],
				['Kirim bahan produksi', 'dbo.ob_bahan_kirim_hdr WHERE model_id = @model_id']
			];
		},
		// cb_delete window produk: artikel, warna, size & harga per size ikut terhapus
		cascade: [
			'dbo.M_PRODUK WHERE model_id = @model_id',
			'dbo.M_PRODUK_MODEL3 WHERE model_id = @model_id',
			'dbo.M_PRODUK_MODEL2 WHERE model_id = @model_id',
			'dbo.M_PRODUK_MODEL_SIZE WHERE model_id = @model_id',
			'dbo.M_PRODUK_MODELX WHERE model_id = @model_id'
		]
	},
	'produk-artikel': {
		def: M.productSku,
		menu: PRODUK_MENU,
		table: 'dbo.M_PRODUK',
		keys: ['produk_id'],
		brand: { column: 'brand_id' },
		order: 'warna_id, size_id',
		stamp,
		// 233 ribu artikel: selalu per model
		filters: { columns: ['model_id'], required: ['model_id'] },
		noCreate: true,
		check: async (_req, v) => {
			for (const k of ['nama', 'nama_pendek', 'nama_pendek2']) if (typeof v[k] === 'string') v[k] = v[k].toUpperCase();
			return null;
		},
		usedIn: SKU_TABLES.map(([label, table]) => [label, `${table} WHERE produk_id = @produk_id`])
	}
};
