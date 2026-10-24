/**
 * Pemetaan master web → tabel lama. Aturan kode & validasi meniru window PowerBuilder
 * (nama program di komentar, lihat dbo.SYS_PROGRAM); field form diambil dari defs/masters.ts
 * dengan key = nama kolom.
 */
import * as M from '#lib/domain/defs/masters.ts';
import type { MasterDef } from '#lib/domain/types.ts';
import type { sql } from '../db.ts';
import { seq, yy } from './codes.ts';
import { HR } from './hr.ts';
import { MATERIAL } from './material.ts';
import { PRODUK } from './produk.ts';

export type Values = Record<string, any>;

export interface Resource {
	def: MasterDef;
	/** path menu yang memberi akses penuh (lihat, tambah, ubah, hapus) */
	menu: string;
	table: string;
	/** kolom kunci (primary key tabel lama), urutan = urutan di id baris */
	keys: string[];
	/** cakupan brand pengguna; `open`: baris dengan brand '%' / kosong terlihat semua; `list: false` = daftar tidak difilter (data bersama) */
	brand?: { column: string; open?: boolean; list?: boolean };
	order: string;
	/** kolom jejak pengubah aplikasi lama */
	stamp?: { user: string; time: string };
	/**
	 * isi kode otomatis saat tambah (dijalankan dalam transaksi, kunci tabel ditahan sampai commit);
	 * `req()` = request baru dalam transaksi dengan parameter @<kolom kunci> yang sudah terisi
	 */
	next?: (req: () => sql.Request, v: Values) => Promise<void>;
	/** validasi tambahan atas nilai yang sudah dikonversi ke format kolom (toggle char = 'Y'/'N'); kembalikan pesan error */
	check?: (req: () => sql.Request, v: Values) => Promise<string | null>;
	/**
	 * tabel yang memakai data ini: [label, `tabel WHERE …`] dengan parameter @<kolom kunci>; atau fungsi yang
	 * menyusunnya saat dicek (boleh menambah parameter ke `req`, mis. daftar kode artikel sebuah model)
	 */
	usedIn?: [string, string][] | ((req: sql.Request, keys: Values) => Promise<[string, string][]>);
	/** kolom kunci IDENTITY: nomornya dibuat database saat tambah (field definisinya `auto`) */
	identity?: string;
	/** kolom yang boleh disaring lewat query daftar (?kolom=nilai); `required`: daftar wajib disaring (tabel besar) */
	filters?: { columns: string[]; required?: string[] };
	/** daftar hanya memuat kunci + field `list` (tabel besar); data lengkap per baris lewat GET ?id= */
	slim?: boolean;
	/** baris dibuat proses lain (mis. proses artikel), bukan lewat form tambah */
	noCreate?: boolean;
	/** data anak yang ikut dihapus dalam transaksi yang sama: `tabel WHERE …` dengan @<kolom kunci> */
	cascade?: string[];
	/** dijalankan dalam transaksi setelah ubah / aktif-nonaktif, dengan kolom yang berubah */
	afterUpdate?: (req: () => sql.Request, changed: Values) => Promise<void>;
}

export const RESOURCES: Record<string, Resource> = {
	supplier: {
		def: M.supplier,
		menu: '/inventory/master/supplier',
		table: 'dbo.M_SUPPLIER',
		keys: ['supp_id', 'brand_id'],
		brand: { column: 'brand_id' },
		order: 'supp_id',
		// W_01_M02: "S" + 3 digit, satu urutan untuk semua brand
		next: async (req, v) => void (v.supp_id = await seq(req(), 'dbo.M_SUPPLIER', 'supp_id', 'S', 3)),
		usedIn: [
			['Pembelian barang', 'dbo.T_BELI1 WHERE supp_id = @supp_id'],
			['Penerimaan gudang', 'dbo.T_GUDANG1 WHERE supp_id = @supp_id'],
			['PO material', 'dbo.ob_bahan_po_hdr WHERE supp_id = @supp_id'],
			['Penerimaan material', 'dbo.ob_bahan_gd_hdr WHERE supp_id = @supp_id'],
			['Hutang (AP)', 'dbo.ap_trans1 WHERE supp_id = @supp_id'],
			['Model produk', 'dbo.M_PRODUK_MODEL WHERE supp_id = @supp_id'],
			['Article raw material', 'dbo.m_bahan_art WHERE supp_id = @supp_id']
		]
	},
	ekspedisi: {
		def: M.expedition,
		menu: '/inventory/master/ekspedisi',
		table: 'dbo.M_EKSPEDISI',
		keys: ['ekspedisi_id'],
		order: 'ekspedisi_id',
		// W_01_M03: "E" + 2 digit
		next: async (req, v) => void (v.ekspedisi_id = await seq(req(), 'dbo.M_EKSPEDISI', 'ekspedisi_id', 'E', 2)),
		usedIn: [
			['Kirim barang (GIT)', 'dbo.T_GIT1 WHERE ekspedisi_id = @ekspedisi_id'],
			['Transaksi gudang', 'dbo.T_GUDANG1 WHERE ekspedisi_id = @ekspedisi_id']
		]
	},
	toko: {
		def: M.store,
		menu: '/sales/master/toko',
		table: 'dbo.M_TOKO',
		keys: ['toko_id'],
		brand: { column: 'brand_id', open: true },
		order: 'toko_id',
		stamp: { user: 'usrupd', time: 'usrtgl' },
		// W_02_M01: "T" + 3 digit
		next: async (req, v) => void (v.toko_id = await seq(req(), 'dbo.M_TOKO', 'toko_id', 'T', 3)),
		usedIn: [
			['Transaksi toko', 'dbo.T_TOKO1 WHERE toko_id = @toko_id'],
			['Kirim barang (GIT)', 'dbo.T_GIT1 WHERE toko_id = @toko_id'],
			['Transaksi gudang', 'dbo.T_GUDANG1 WHERE toko_id = @toko_id'],
			['Penjualan', 'dbo.T_JUAL1 WHERE toko_id = @toko_id'],
			['Saldo awal toko', 'dbo.S_AWAL_TOKO WHERE toko_id = @toko_id'],
			['Pengguna', 'dbo.AppUser WHERE toko_id = @toko_id']
		]
	},
	customer: {
		def: M.customer,
		menu: '/toko/master/customer',
		table: 'dbo.M_CUSTOMER',
		keys: ['site_id', 'cust_id'],
		order: 'site_id, cust_id',
		stamp: { user: 'usrupd', time: 'usrtgl' },
		// W_02B_M01: site + 2 digit tahun + 3 digit urut per site & tahun
		next: async (req, v) => void (v.cust_id = await seq(req(), 'dbo.M_CUSTOMER', 'cust_id', String(v.site_id) + yy(), 3, 'site_id = @site_id')),
		usedIn: [
			['Transaksi toko', 'dbo.T_TOKO1 WHERE site_id = @site_id AND cust_id = @cust_id'],
			['Piutang (AR)', 'dbo.ar_trans1 WHERE site_id = @site_id AND cust_id = @cust_id']
		]
	},
	bank: {
		def: M.bank,
		menu: '/toko/master/bank',
		table: 'dbo.M_BANK',
		keys: ['bank_id'],
		order: 'bank_id',
		// W_02B_M02: 3 digit
		next: async (req, v) => void (v.bank_id = await seq(req(), 'dbo.M_BANK', 'bank_id', '', 3)),
		usedIn: [
			['Pembayaran toko', 'dbo.T_PAYMENT WHERE bank_id = @bank_id'],
			['Transaksi toko', 'dbo.T_TOKO1 WHERE bank_id = @bank_id'],
			['Rekening', 'dbo.M_REKENING WHERE bank_id = @bank_id']
		]
	},
	coa: {
		def: M.coa,
		menu: '/akunting/master/coa',
		table: 'dbo.gl_coa',
		keys: ['site_id', 'account_id', 'brand_id'],
		// bagan akun dipakai bersama (aplikasi lama menyimpan hampir semua akun di brand A)
		brand: { column: 'brand_id', list: false },
		order: 'account_id, site_id, brand_id',
		check: async (_req, v) => {
			// W_GL_01_ENTRY: akun cash flow / cost center dikosongkan bila flag N
			if (v.flag_cf !== 'Y') v.account_cf = null;
			if (v.flag_cc !== 'Y') v.cc_id = null;
			return null;
		},
		usedIn: [
			['Jurnal GL', 'dbo.gl_journal_detail WHERE site_id = @site_id AND account_id = @account_id'],
			['Jurnal kas/bank', 'dbo.cb_journal_detail WHERE site_id = @site_id AND account_id = @account_id'],
			['Saldo GL', 'dbo.gl_balance WHERE site_id = @site_id AND account_id = @account_id'],
			['Master kas/bank', 'dbo.cb_master WHERE site_id = @site_id AND account_id = @account_id']
		]
	},
	site: {
		def: M.site,
		menu: '/akunting/master/site',
		table: 'dbo.gl_site',
		keys: ['site_id'],
		order: 'site_id',
		usedIn: [
			['COA', 'dbo.gl_coa WHERE site_id = @site_id'],
			['Toko', 'dbo.M_TOKO WHERE site_id = @site_id'],
			['Customer', 'dbo.M_CUSTOMER WHERE site_id = @site_id'],
			['Master kas/bank', 'dbo.cb_master WHERE site_id = @site_id'],
			['Jurnal GL', 'dbo.gl_journal WHERE site_id = @site_id'],
			['Transaksi toko', 'dbo.T_TOKO1 WHERE site_id = @site_id']
		]
	},
	'kas-bank': {
		def: M.cashBank,
		menu: '/akunting/master/kas-bank',
		table: 'dbo.cb_master',
		keys: ['site_id', 'kd_bank', 'brand_id'],
		brand: { column: 'brand_id' },
		order: 'site_id, kd_bank, brand_id',
		stamp: { user: 'usrupd', time: 'usrtgl' },
		// W_CB_01_ENTRY: akun G/L harus ada di COA site yang sama
		check: async (req, v) => {
			const r = await req().input('s', v.site_id).input('a', v.account_id).query('SELECT COUNT(*) AS n FROM dbo.gl_coa WHERE site_id = @s AND account_id = @a');
			return r.recordset[0].n ? null : `Akun ${v.account_id} tidak ada di COA site ${v.site_id}`;
		},
		usedIn: [
			['Jurnal kas/bank', 'dbo.cb_journal WHERE site_id = @site_id AND kd_bank = @kd_bank AND brand_id = @brand_id'],
			['Tutup kas', 'dbo.cb_close WHERE site_id = @site_id AND kd_bank = @kd_bank']
		]
	},
	...PRODUK,
	...MATERIAL,
	...HR
};

/** master yang memakai menu ini (untuk pengecekan hak akses) */
export const resourceOf = (name: string): Resource | undefined => (Object.hasOwn(RESOURCES, name) ? RESOURCES[name] : undefined);
