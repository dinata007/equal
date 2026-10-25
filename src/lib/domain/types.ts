import type { Component } from 'svelte';
import type { UiPrefs } from './prefs';

/* ---------- Data ---------- */
export type Row = { id: string; [k: string]: any };
export type DocStatus = 'draft' | 'posted' | 'void';
export interface Line {
	_k: string; // key stabil untuk keyed each
	[k: string]: any;
}
export interface Doc extends Row {
	no: string;
	date: string; // yyyy-mm-dd
	status: DocStatus;
	lines: Line[];
	notes?: string;
	total?: number;
	createdBy?: string;
	createdAt?: string;
	updatedAt?: string;
}

/* ---------- Otorisasi ---------- */
/** Aksi tetap dicek per tombol, tapi izinnya on/off per menu (menu aktif = semua aksi). */
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'post';

/** Pengguna yang sedang login (dari server; tanpa data rahasia) */
export interface SessionUser {
	id: number;
	username: string;
	name: string;
	/** admin: akses penuh ke semua menu, termasuk Pengguna & Hak Akses */
	admin: boolean;
	/** toko default (id toko di database) */
	storeId: string | null;
	/** wajib ganti password sebelum memakai aplikasi */
	mustChange: boolean;
	/** path menu yang aktif (admin: semua menu, daftar ini diabaikan) */
	menus: string[];
	/** brand yang boleh dilihat; ['*'] = semua */
	brands: string[];
	/** versi foto profil (null = belum ada foto) → /api/avatar/{id}?v={avatar} */
	avatar: number | null;
	/** preferensi tampilan dari akun (null = belum pernah disimpan, pakai yang ada di perangkat) */
	prefs: UiPrefs | null;
}

/** Data pengguna untuk menu Pengguna & Hak Akses (admin) */
export interface ManagedUser {
	id: number;
	username: string;
	name: string;
	admin: boolean;
	active: boolean;
	storeId: string | null;
	menus: string[];
	brands: string[];
	hasPassword: boolean;
	mustChange: boolean;
	locked: boolean;
	legacyId: string | null;
	lastLoginAt: string | null;
	avatar: number | null;
}

/* ---------- Definisi field ---------- */
export type FieldType =
	| 'text'
	| 'textarea'
	| 'number'
	| 'money'
	| 'date'
	| 'time'
	| 'select'
	| 'lookup'
	| 'toggle'
	| 'email'
	| 'tel'
	| 'password';

export interface FieldDef {
	key: string;
	label: string;
	type?: FieldType;
	required?: boolean;
	unique?: boolean;
	placeholder?: string;
	/** pilihan select: teks apa adanya, atau kode database + label */
	options?: (string | { value: string; label: string })[];
	/** lookup ke tabel lain */
	ref?: string;
	/** lookup ke data server (nama di /api/lookup/[name]), pengganti `ref` untuk master dari database */
	source?: string;
	refFilter?: (row: Row, form: Record<string, any>) => boolean;
	/** jumlah desimal isian angka (default: uang 0, angka 2) */
	decimals?: number;
	/** panjang maksimum teks (mengikuti kolom database) */
	maxLength?: number;
	/** kode dibuat otomatis oleh server saat data baru disimpan */
	auto?: boolean;
	/** tidak bisa diubah setelah data tersimpan (bagian kunci tabel lama) */
	lockOnEdit?: boolean;
	/** lebar di grid form: 1 | 2 (full) */
	span?: 1 | 2;
	default?: string | number | boolean | ((ctx: DefaultCtx) => any);
	/** tampil di tabel list */
	list?: boolean;
	/** tampil di kartu mobile */
	mobile?: 'title' | 'subtitle' | 'meta';
	readonly?: boolean;
	showIf?: (form: Record<string, any>) => boolean;
	hint?: string;
	/** judul kelompok isian, ditampilkan sebelum field ini di form */
	section?: string;
}
export interface DefaultCtx {
	userStoreId?: string;
	today: string;
}

/* ---------- Definisi halaman ---------- */
export interface MasterDef {
	kind: 'master';
	/** tabel data prototipe (localStorage) */
	table?: string;
	/** master dari database: nama resource di /api/master/[resource] (key field = nama kolom tabel lama) */
	resource?: string;
	codeField?: string;
	nameField?: string;
	/** field status aktif (default `active`) */
	activeField?: string;
	/** urutan isian form = urutan entry window PowerBuilder */
	fields: FieldDef[];
	/** kolom tabel & urutannya = grid PowerBuilder, menggantikan flag `list` (default: field `list` sesuai urutan form) */
	columns?: string[];
	/** sort awal tabel = sort grid PowerBuilder, boleh beberapa kolom (default: field pertama) */
	sortField?: string | string[];
	/** tombol "Salin jadi baru": isian data terbuka disalin ke form tambah (kode otomatis dikosongkan) */
	copyable?: boolean;
	/** isian turunan: dipanggil setelah pengguna mengubah `key` (mis. hitung harga per satuan) */
	derive?: (form: Record<string, any>, key: string) => void;
}

/** Pilihan lookup dari server: kode/nama + atribut tambahan untuk filter (mis. site) */
export interface LookupOption {
	id: string;
	code: string;
	name: string;
	hint?: string;
	active: boolean;
	[k: string]: any;
}

export interface LineField {
	key: string;
	label: string;
	type: 'item' | 'number' | 'money' | 'text' | 'select' | 'lookup' | 'time' | 'computed';
	options?: string[];
	ref?: string;
	width?: string;
	readonly?: boolean;
	compute?: (line: Line, doc: Doc) => number;
	format?: 'money' | 'number';
	required?: boolean;
}
export interface LinesDef {
	label?: string;
	itemTable?: string;
	itemLabel?: string;
	fields: LineField[];
	/** nilai baris untuk total */
	amount?: (line: Line) => number;
	/** saat item dipilih: isi harga, satuan, dll */
	onItem?: (line: Line, item: Row, doc: Doc) => void;
}

export interface StockEffect {
	itemTable: 'raw_materials' | 'products';
	loc: (doc: Doc) => string;
	qty: (line: Line) => number; // bertanda: + masuk, - keluar
}
export interface LedgerEffect {
	kind: 'ar' | 'ap';
	partyField: string;
	/** +1 menambah saldo (piutang/hutang), -1 mengurangi */
	sign: 1 | -1;
	when?: (doc: Doc) => boolean;
}
export interface SourceDef {
	table: string;
	label: string;
	/** dokumen sumber yang boleh dipilih */
	filter?: (src: Doc, form: Doc) => boolean;
	header?: (src: Doc) => Partial<Doc>;
	line?: (l: Line) => Partial<Line>;
	/** qty per item tidak boleh melebihi dokumen sumber & item harus ada di sumber (mutasi antar lokasi) */
	strictQty?: boolean;
}
export interface JournalLine {
	coa: string; // kode akun
	debit: number;
	credit: number;
	memo?: string;
}

export interface TxDef {
	kind: 'transaction';
	table: string;
	prefix: string;
	header: FieldDef[];
	lines?: LinesDef;
	/** kolom pihak utama untuk list */
	party?: { field: string; ref: string; label: string };
	totals?: { discount?: boolean; tax?: boolean };
	source?: SourceDef;
	stock?: StockEffect;
	ledger?: LedgerEffect[];
	/** efek kas/bank: akun dari kolom `field`, atau dihitung dengan `kasbank(doc)` */
	cash?: { field?: string; kasbank?: (doc: Doc) => string; sign: 1 | -1 };
	journal?: (doc: Doc) => JournalLine[];
	/** validasi tambahan khusus transaksi ini; kembalikan pesan error atau null */
	validate?: (doc: Doc) => string | null;
	/** dijalankan sebelum validasi posting (mis. hitung ulang qty sistem stok opname) */
	beforePost?: (doc: Doc) => void;
	/** wajib seimbang debit=kredit (jurnal) */
	balanced?: boolean;
	closingScope?: 'MAT' | 'INV' | 'TOKO';
	/** label tombol posting, mis. "Setujui" */
	postLabel?: string;
	statusLabels?: Partial<Record<DocStatus, string>>;
	/** tanpa total uang */
	noAmount?: boolean;
}

/**
 * Halaman laporan & halaman khusus yang dipanggil menu. Kunci = nama file di pages/ (kebab-case);
 * pemetaannya di routes/(app)/[...path]/+page.svelte — bertipe, jadi salah ketik ketahuan saat `npm run check`.
 */
export type ReportPage = 'mutasi-stok' | 'kartu-stok' | 'analisa-penjualan' | 'mutasi-hutang-piutang' | 'kartu-hutang-piutang' | 'buku-kas-bank' | 'jurnal' | 'absensi';
export type CustomPage = 'atribut' | 'pegawai' | 'pengguna' | 'closing-stok';

export interface ReportDef {
	kind: 'report';
	component: ReportPage;
	props?: Record<string, any>;
}
export interface CustomDef {
	kind: 'custom';
	component: CustomPage;
	props?: Record<string, any>;
}
export type PageDef = MasterDef | TxDef | ReportDef | CustomDef;

/* ---------- Menu ---------- */
export interface MenuNode {
	slug: string;
	label: string;
	icon?: Component<any>;
	description?: string;
	children?: MenuNode[];
	page?: PageDef;
	/** hanya untuk user dengan flag admin; tidak diatur lewat sakelar menu */
	adminOnly?: boolean;
	/** diisi saat build: path lengkap */
	path?: string;
	/** jalur label (breadcrumb) */
	trail?: string[];
}
