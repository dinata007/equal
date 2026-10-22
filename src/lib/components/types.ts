import type { Component, Snippet } from 'svelte';

export type FilterKind = 'text' | 'select' | 'number' | 'date';

export interface Col<R> {
	key: string;
	label: string;
	align?: 'right' | 'center';
	value?: (row: R) => any;
	cell?: Snippet<[R]>;
	/** format tampilan (nilai mentah tetap dipakai untuk sort/cari) */
	format?: (v: any) => string;
	class?: string;
	sortable?: boolean;
	/** jenis filter kolom; default ditebak dari data. `false` = tanpa filter */
	filter?: FilterKind | false;
	/** tampilkan jumlah kolom ini di baris total */
	sum?: boolean;
	/** lebar awal (px); default diukur dari isi */
	width?: number;
	/** boleh disembunyikan lewat pengaturan kolom (default true) */
	hideable?: boolean;
}

export interface BulkAction<R> {
	label: string;
	icon?: Component<any>;
	danger?: boolean;
	/** hanya berlaku untuk baris yang memenuhi; tombol disembunyikan bila tidak ada */
	when?: (row: R) => boolean;
	/** kembalikan `false` agar pilihan tidak dikosongkan */
	run: (rows: R[]) => void | boolean | Promise<void | boolean>;
}

/** jenis data kolom untuk filter & urut (gaya Excel) */
export type FilterType = 'text' | 'number' | 'date';

/** satu syarat filter, mis. { op: 'gt', v: 100000 } atau { op: 'between', v: '2026-10-01', v2: '2026-10-31' } */
export interface Cond {
	op: string;
	v?: any;
	v2?: any;
}

export type FilterValue =
	/** daftar nilai yang dicentang (`in`) atau yang tidak dicentang (`out`, bila lebih ringkas) */
	| { kind: 'values'; mode: 'in' | 'out'; values: string[] }
	/** filter bersyarat: satu atau dua syarat digabung Dan/Atau */
	| { kind: 'cond'; a: Cond; b?: Cond | null; join: 'and' | 'or' };

export interface SortKey {
	key: string;
	dir: 1 | -1;
}
