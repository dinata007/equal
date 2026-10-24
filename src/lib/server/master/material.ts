/**
 * Master raw material dari tabel lama (PowerBuilder W_10_M01–M08): article `m_bahan_art` dan atributnya.
 * Article & atributnya dikelola dari satu menu bertab Raw Material (tab pertama = article).
 */
import * as M from '#lib/erp/defs/masters.ts';
import { AuthError } from '../auth/users.ts';
import { sql } from '../db.ts';
import { kodeUrut } from './codes.ts';
import { WARNA_DIPAKAI } from './produk.ts';
import type { Resource, Values } from './registry.ts';

const ATRIBUT = '/material/master/raw-material';
const stamp = { user: 'usrupd', time: 'tglupd' };
const dipakaiArt = (col: string): [string, string][] => [['Raw material', `dbo.m_bahan_art WHERE ${col} = @${col}`]];

/** transaksi & saldo yang menyimpan kode article */
const ART_TABLES: [string, string][] = [
	['PO material', 'dbo.ob_bahan_po_dtl'],
	['Penerimaan material', 'dbo.ob_bahan_gd_dtl'],
	['Penerimaan roll', 'dbo.ob_bahan_gdrol_dtl'],
	['Roll material', 'dbo.ob_bahan_roll_dtl'],
	['Kirim material', 'dbo.ob_bahan_kirim_dtl'],
	['Pemakaian material', 'dbo.ob_bahan_pakai_dtl'],
	['Penjualan material', 'dbo.ob_bahan_jual_dtl'],
	['Costing', 'dbo.ob_bahan_cost_dtl'],
	['Saldo awal material', 'dbo.saldo_awal_art'],
	['Saldo awal per supplier', 'dbo.saldo_awal_art_supp'],
	['Stok opname material', 'dbo.T_OPNAME_RAW'],
	['Aset', 'dbo.gl_aset'],
	['Rincian aset', 'dbo.gl_aset_dtl']
];

/** W_10_M07_ENTRY pb_save: kode = brand + 3 digit akhir supplier + induk + jenis + tipe + tahun + warna + urut */
async function nextArt(req: () => sql.Request, v: Values) {
	const prefix = `${v.brand_id}${String(v.supp_id).trim().slice(-3)}${v.induk_id}${v.jenis_id}${v.tipe_id}${String((v.thn as Date).getFullYear()).slice(2)}${v.warna_id}`;
	if (prefix.length !== 12) throw new AuthError('Kode brand, supplier, induk, jenis, tipe atau warna tidak sesuai format kode raw material');
	const r = await req().input('p', sql.VarChar(12), prefix).query(`
		SELECT MAX(TRY_CAST(RIGHT(RTRIM(art_id), 3) AS int)) AS n FROM dbo.m_bahan_art WITH (UPDLOCK, HOLDLOCK) WHERE LEFT(art_id, 12) = @p`);
	const n = (r.recordset[0]?.n ?? 0) + 1;
	if (n > 999) throw new AuthError(`Nomor urut raw material ${prefix} sudah habis`);
	v.urut = String(n).padStart(3, '0');
	v.art_id = prefix + v.urut;
}

async function checkArt(req: () => sql.Request, v: Values) {
	// tombol jenis COA PB mengisi item & akun AP sekaligus
	v.acc_ap_id = v.item_id;
	if (v.art_id) return null;
	// baru: supplier & jenis COA harus milik brand article (W_search_supp_brand, dddw per brand)
	const s = await req().input('s', sql.VarChar(7), v.supp_id).input('b', sql.VarChar(2), v.brand_id).query('SELECT TOP 1 nama FROM dbo.M_SUPPLIER WHERE supp_id = @s AND RTRIM(brand_id) = @b');
	if (!s.recordset[0]) return `Supplier ${v.supp_id} bukan supplier brand ${v.brand_id}`;
	v.supp_desc = String(s.recordset[0].nama ?? '').trim().slice(0, 50) || null;
	const c = await req().input('i', sql.VarChar(2), v.item_id).input('b', sql.VarChar(2), v.brand_id).query('SELECT COUNT(*) AS n FROM dbo.m_bahan_acc WHERE acc_ap_id = @i AND RTRIM(brand_id) = @b');
	if (!c.recordset[0].n) return `Jenis COA ${v.item_id} tidak ada untuk brand ${v.brand_id}`;
	return null;
}

export const MATERIAL: Record<string, Resource> = {
	bahan: {
		def: M.rawMaterial,
		menu: '/material/master/raw-material',
		table: 'dbo.m_bahan_art',
		keys: ['art_id', 'brand_id'],
		brand: { column: 'brand_id' },
		order: 'art_desc, art_id',
		stamp,
		slim: true,
		next: nextArt,
		check: checkArt,
		usedIn: ART_TABLES.map(([label, table]) => [label, `${table} WHERE art_id = @art_id`])
	},
	'bahan-induk': {
		def: M.materialInduk,
		menu: ATRIBUT,
		table: 'dbo.m_bahan_induk',
		keys: ['induk_id'],
		// induk dipakai lintas brand di form article; ubah hanya untuk brand pengguna
		brand: { column: 'brand_id', list: false },
		order: 'induk_id',
		usedIn: dipakaiArt('induk_id')
	},
	'bahan-jenis': {
		def: M.materialJenis,
		menu: ATRIBUT,
		table: 'dbo.m_bahan_jenis',
		keys: ['jenis_id'],
		order: 'jenis_id',
		usedIn: dipakaiArt('jenis_id')
	},
	'bahan-tipe': {
		def: M.materialTipe,
		menu: ATRIBUT,
		table: 'dbo.m_bahan_tipe',
		keys: ['tipe_id'],
		order: 'tipe_id',
		usedIn: dipakaiArt('tipe_id')
	},
	// W_10_M04: tabel warna produk (hapus di PB keliru ke m_bahan_warna)
	'bahan-warna': {
		def: M.materialColor,
		menu: ATRIBUT,
		table: 'dbo.M_PRODUK_WARNA',
		keys: ['warna_id'],
		order: 'warna_id',
		stamp: { user: 'usrupd', time: 'usrtgl' },
		usedIn: WARNA_DIPAKAI
	},
	'bahan-coa': {
		def: M.materialCoa,
		menu: ATRIBUT,
		table: 'dbo.m_bahan_acc',
		keys: ['brand_id', 'acc_ap_id'],
		brand: { column: 'brand_id' },
		order: 'brand_id, acc_ap_id',
		usedIn: [['Raw material', 'dbo.m_bahan_art WHERE brand_id = @brand_id AND (acc_ap_id = @acc_ap_id OR item_id = @acc_ap_id)']]
	},
	'bahan-satuan': {
		def: M.materialUnit,
		menu: ATRIBUT,
		table: 'dbo.m_bahan_sat',
		keys: ['sat_id'],
		order: 'sat_id',
		next: kodeUrut('dbo.m_bahan_sat', 'sat_id', 2),
		usedIn: [
			['Raw material', 'dbo.m_bahan_art WHERE sat_id = @sat_id OR sat_id2 = @sat_id'],
			['PO material', 'dbo.ob_bahan_po_dtl WHERE sat_id = @sat_id'],
			['Penerimaan material', 'dbo.ob_bahan_gd_dtl WHERE sat_id = @sat_id'],
			['Penerimaan roll', 'dbo.ob_bahan_gdrol_dtl WHERE sat_id = @sat_id'],
			['Kirim material', 'dbo.ob_bahan_kirim_dtl WHERE sat_id = @sat_id']
		]
	},
	'bahan-dept': {
		def: M.materialDept,
		menu: ATRIBUT,
		table: 'dbo.m_bahan_dept',
		keys: ['dept_id'],
		order: 'dept_id',
		next: kodeUrut('dbo.m_bahan_dept', 'dept_id', 3),
		usedIn: dipakaiArt('dept_id')
	}
};
