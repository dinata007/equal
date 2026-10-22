import type { Component } from 'svelte';

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

export interface User extends Row {
	username: string;
	name: string;
	password: string;
	/** admin sistem: akses penuh ke semua menu, termasuk menu khusus admin (Pengguna & Hak Akses) */
	admin?: boolean;
	/** path menu -> aktif; kunci prefix (mis. "/toko") berlaku untuk semua menu di bawahnya */
	access: Record<string, boolean>;
	storeId?: string;
	active: boolean;
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
	options?: string[];
	/** lookup ke tabel lain */
	ref?: string;
	refFilter?: (row: Row, form: Record<string, any>) => boolean;
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
}
export interface DefaultCtx {
	userStoreId?: string;
	today: string;
}

/* ---------- Definisi halaman ---------- */
export interface MasterDef {
	kind: 'master';
	table: string;
	codeField?: string;
	nameField?: string;
	fields: FieldDef[];
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
	cash?: { field: string; sign: 1 | -1 };
	journal?: (doc: Doc) => JournalLine[];
	/** wajib seimbang debit=kredit (jurnal) */
	balanced?: boolean;
	closingScope?: 'MAT' | 'INV' | 'TOKO';
	/** label tombol posting, mis. "Setujui" */
	postLabel?: string;
	statusLabels?: Partial<Record<DocStatus, string>>;
	/** tanpa total uang */
	noAmount?: boolean;
}

export interface ReportDef {
	kind: 'report';
	component: string;
	props?: Record<string, any>;
}
export interface CustomDef {
	kind: 'custom';
	component: string;
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
