/**
 * Logika murni DataTable: filter kolom, tebakan jenis filter, ukur lebar kolom,
 * penyimpanan preferensi per user, dan sorotan hasil cari (CSS Custom Highlight API).
 */
import { addDays, date as fdate, monthEnd, monthStart, num, today } from '#lib/erp/format.ts';
import type { Col, Cond, FilterType, FilterValue, SortKey } from '../types';

export const val = <T>(c: Col<T>, r: T): any => (c.value ? c.value(r) : (r as any)[c.key]);
/** teks yang tampil di sel (dipakai untuk cari, filter pilihan, dan lebar) */
export const text = <T>(c: Col<T>, r: T): string => {
	const v = val(c, r);
	return c.format ? c.format(v) : String(v ?? '');
};

/* ---------------- filter gaya Excel ---------------- */
const ISO = /^\d{4}-\d{2}-\d{2}/;

/** jenis data kolom: angka / tanggal (yyyy-mm-dd) / teks */
export function filterType<T>(c: Col<T>, rows: T[]): FilterType {
	if (c.filter === 'number' || c.filter === 'date' || c.filter === 'text') return c.filter;
	if (c.filter === 'select') return 'text';
	const sample: any[] = [];
	for (const r of rows) {
		const v = val(c, r);
		if (v !== '' && v != null) sample.push(v);
		if (sample.length >= 300) break;
	}
	if (!sample.length) return 'text';
	if (sample.every((v) => typeof v === 'number')) return 'number';
	if (sample.every((v) => typeof v === 'string' && ISO.test(v))) return 'date';
	return 'text';
}

/** kunci nilai untuk daftar centang: tanggal = yyyy-mm-dd, angka = angka mentah, teks = teks tampil; '' = kosong */
export function vkey<T>(type: FilterType, c: Col<T>, r: T): string {
	const v = val(c, r);
	if (v === '' || v == null) return '';
	if (type === 'date') return String(v).slice(0, 10);
	if (type === 'number') return String(Number(v));
	return text(c, r);
}
export function vlabel<T>(type: FilterType, c: Col<T>, key: string): string {
	if (!key) return '(Kosong)';
	if (type === 'date') return fdate(key);
	if (type === 'number') return c.format ? c.format(Number(key)) : num(key);
	return key;
}

export interface OpDef {
	op: string;
	label: string;
	/** jumlah nilai yang diisi: 0 (mis. "Bulan ini"), 1, atau 2 ("Di antara") */
	arity: 0 | 1 | 2;
}
export const OPS: Record<FilterType, OpDef[]> = {
	text: [
		{ op: 'eq', label: 'Sama dengan', arity: 1 },
		{ op: 'ne', label: 'Tidak sama dengan', arity: 1 },
		{ op: 'begins', label: 'Diawali', arity: 1 },
		{ op: 'ends', label: 'Diakhiri', arity: 1 },
		{ op: 'contains', label: 'Mengandung', arity: 1 },
		{ op: 'ncontains', label: 'Tidak mengandung', arity: 1 },
		{ op: 'blank', label: 'Kosong', arity: 0 },
		{ op: 'nblank', label: 'Tidak kosong', arity: 0 }
	],
	number: [
		{ op: 'eq', label: 'Sama dengan', arity: 1 },
		{ op: 'ne', label: 'Tidak sama dengan', arity: 1 },
		{ op: 'gt', label: 'Lebih dari', arity: 1 },
		{ op: 'gte', label: 'Lebih dari atau sama dengan', arity: 1 },
		{ op: 'lt', label: 'Kurang dari', arity: 1 },
		{ op: 'lte', label: 'Kurang dari atau sama dengan', arity: 1 },
		{ op: 'between', label: 'Di antara', arity: 2 },
		{ op: 'top', label: 'N teratas', arity: 1 },
		{ op: 'bottom', label: 'N terbawah', arity: 1 },
		{ op: 'above', label: 'Di atas rata-rata', arity: 0 },
		{ op: 'below', label: 'Di bawah rata-rata', arity: 0 }
	],
	date: [
		{ op: 'eq', label: 'Pada tanggal', arity: 1 },
		{ op: 'before', label: 'Sebelum', arity: 1 },
		{ op: 'after', label: 'Sesudah', arity: 1 },
		{ op: 'between', label: 'Di antara', arity: 2 },
		{ op: 'today', label: 'Hari ini', arity: 0 },
		{ op: 'yesterday', label: 'Kemarin', arity: 0 },
		{ op: 'thisWeek', label: 'Minggu ini', arity: 0 },
		{ op: 'lastWeek', label: 'Minggu lalu', arity: 0 },
		{ op: 'thisMonth', label: 'Bulan ini', arity: 0 },
		{ op: 'lastMonth', label: 'Bulan lalu', arity: 0 },
		{ op: 'thisYear', label: 'Tahun ini', arity: 0 }
	]
};
export const opDef = (type: FilterType, op: string) => OPS[type].find((o) => o.op === op);
const filled = (v: any) => v !== '' && v != null;
export function condOk(type: FilterType, c: Cond | null | undefined): c is Cond {
	const d = c && opDef(type, c.op);
	if (!d) return false;
	return d.arity === 0 || (filled(c.v) && (d.arity === 1 || filled(c.v2)));
}

/** rentang tanggal untuk syarat tanpa nilai (Hari ini, Bulan ini, …) */
function preset(op: string): [string, string] | null {
	const t = today();
	const mon = addDays(t, -((new Date(t + 'T00:00:00').getDay() + 6) % 7));
	const lastMonth = monthStart(addDays(monthStart(t), -1));
	switch (op) {
		case 'today':
			return [t, t];
		case 'yesterday':
			return [addDays(t, -1), addDays(t, -1)];
		case 'thisWeek':
			return [mon, addDays(mon, 6)];
		case 'lastWeek':
			return [addDays(mon, -7), addDays(mon, -1)];
		case 'thisMonth':
			return [monthStart(t), monthEnd(t.slice(0, 7))];
		case 'lastMonth':
			return [lastMonth, monthEnd(lastMonth.slice(0, 7))];
		case 'thisYear':
			return [t.slice(0, 4) + '-01-01', t.slice(0, 4) + '-12-31'];
	}
	return null;
}

function condPred<T>(cd: Cond, type: FilterType, c: Col<T>, rows: T[]): (r: T) => boolean {
	if (type === 'number') {
		const n = (r: T) => {
			const v = val(c, r);
			return v === '' || v == null ? NaN : Number(v);
		};
		const v = Number(cd.v);
		const v2 = Number(cd.v2);
		switch (cd.op) {
			case 'eq':
				return (r) => n(r) === v;
			case 'ne':
				return (r) => n(r) !== v;
			case 'gt':
				return (r) => n(r) > v;
			case 'gte':
				return (r) => n(r) >= v;
			case 'lt':
				return (r) => n(r) < v;
			case 'lte':
				return (r) => n(r) <= v;
			case 'between': {
				const [lo, hi] = v <= v2 ? [v, v2] : [v2, v];
				return (r) => n(r) >= lo && n(r) <= hi;
			}
			case 'top':
			case 'bottom': {
				const all = rows.map(n).filter(Number.isFinite).sort((a, b) => (cd.op === 'top' ? b - a : a - b));
				const thr = all[Math.min(Math.max(1, Math.floor(v) || 10), all.length) - 1];
				return cd.op === 'top' ? (r) => n(r) >= thr : (r) => n(r) <= thr;
			}
			case 'above':
			case 'below': {
				const all = rows.map(n).filter(Number.isFinite);
				const avg = all.reduce((s, x) => s + x, 0) / (all.length || 1);
				return cd.op === 'above' ? (r) => n(r) > avg : (r) => n(r) < avg;
			}
		}
	} else if (type === 'date') {
		const s = (r: T) => String(val(c, r) ?? '').slice(0, 10);
		const range = cd.op === 'between' ? ([cd.v, cd.v2].sort() as [string, string]) : preset(cd.op);
		if (range) return (r) => !!s(r) && s(r) >= range[0] && s(r) <= range[1];
		switch (cd.op) {
			case 'eq':
				return (r) => s(r) === cd.v;
			case 'before':
				return (r) => !!s(r) && s(r) < cd.v;
			case 'after':
				return (r) => s(r) > cd.v;
		}
	} else {
		const t = (r: T) => text(c, r).toLowerCase();
		const q = String(cd.v ?? '').toLowerCase();
		switch (cd.op) {
			case 'eq':
				return (r) => t(r) === q;
			case 'ne':
				return (r) => t(r) !== q;
			case 'begins':
				return (r) => t(r).startsWith(q);
			case 'ends':
				return (r) => t(r).endsWith(q);
			case 'contains':
				return (r) => t(r).includes(q);
			case 'ncontains':
				return (r) => !t(r).includes(q);
			case 'blank':
				return (r) => !t(r).trim();
			case 'nblank':
				return (r) => !!t(r).trim();
		}
	}
	return () => true;
}

/** ubah filter jadi fungsi uji baris; `rows` dipakai untuk N teratas & rata-rata */
export function compile<T>(f: FilterValue, type: FilterType, c: Col<T>, rows: T[]): (r: T) => boolean {
	if (f.kind === 'values') {
		const set = new Set(f.values);
		const inn = f.mode === 'in';
		return (r) => set.has(vkey(type, c, r)) === inn;
	}
	const pa = condPred(f.a, type, c, rows);
	if (!condOk(type, f.b)) return pa;
	const pb = condPred(f.b, type, c, rows);
	return f.join === 'or' ? (r) => pa(r) || pb(r) : (r) => pa(r) && pb(r);
}

export function isActive(f: FilterValue | undefined): f is FilterValue {
	if (!f || typeof f !== 'object') return false;
	if (f.kind === 'values') return Array.isArray(f.values) && (f.mode === 'in' || f.values.length > 0);
	if (f.kind === 'cond') return !!f.a?.op;
	return false; // format lama dari versi sebelumnya → diabaikan
}

/** ringkasan filter untuk chip, mis. "Draft, Posted" / "> 100.000 dan < 500.000" / "Bulan ini" */
export function describe<T>(f: FilterValue, type: FilterType, c: Col<T>): string {
	if (f.kind === 'values') {
		const ls = f.values.map((k) => vlabel(type, c, k));
		const list = ls.length <= 2 ? ls.join(', ') : type === 'date' ? `${ls.length} tanggal` : `${ls[0]} +${ls.length - 1}`;
		return f.mode === 'in' ? list : `Kecuali ${list}`;
	}
	const fv = (v: any) => (type === 'number' ? vlabel(type, c, String(v)) : type === 'date' ? fdate(v) : `“${v}”`);
	const one = (cd: Cond) => {
		const d = opDef(type, cd.op);
		const sym: Record<string, string> = { eq: type === 'date' ? '' : '=', ne: '≠', gt: '>', gte: '≥', lt: '<', lte: '≤', before: 'sebelum', after: 'sesudah', begins: 'diawali', ends: 'diakhiri', contains: 'mengandung', ncontains: 'tanpa' };
		if (!d) return '';
		if (d.arity === 0) return d.label;
		if (cd.op === 'between') return `${fv(cd.v)} – ${fv(cd.v2)}`;
		if (cd.op === 'top' || cd.op === 'bottom') return `${Math.floor(Number(cd.v)) || 10} ${cd.op === 'top' ? 'teratas' : 'terbawah'}`;
		return `${sym[cd.op] ?? d.label} ${fv(cd.v)}`.trim();
	};
	return condOk(type, f.b) ? `${one(f.a)} ${f.join === 'or' ? 'atau' : 'dan'} ${one(f.b)}` : one(f.a);
}

/* ---------------- sort ---------------- */
export function compare<T>(c: Col<T>, a: T, b: T): number {
	const x = val(c, a);
	const y = val(c, b);
	if (typeof x === 'number' && typeof y === 'number') return x - y;
	return String(x ?? '').localeCompare(String(y ?? ''), 'id', { numeric: true });
}

/* ---------------- lebar kolom ---------------- */
let ctx: CanvasRenderingContext2D | null = null;
function measure(s: string, font: string) {
	ctx ??= document.createElement('canvas').getContext('2d');
	if (!ctx) return s.length * 7.5;
	ctx.font = font;
	return ctx.measureText(s).width;
}
/** semua ukuran grid berbasis rem → ikut ukuran font dasar */
const remScale = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;
const FONT = '"Source Sans 3", system-ui, sans-serif';

/** judul: teks + padding, ikon urut + nomor urut ganda, tombol filter */
function headWidth(label: string, k: number) {
	return measure(label.toUpperCase(), `600 ${12 * k}px ${FONT}`) + label.length * 0.3 * k + 80 * k;
}
const bodyWidth = (s: string, k: number, cell: boolean) => measure(s, `400 ${14 * k}px ${FONT}`) + (26 + (cell ? 18 : 0)) * k + 4;

/** lebar kolom dari isi (persentil 95 agar satu nilai panjang tidak melebarkan kolom) */
export function autoWidth<T>(c: Col<T>, rows: T[], limit = 400): number {
	const k = remScale();
	const ws: number[] = [];
	const step = Math.max(1, Math.floor(rows.length / limit));
	for (let i = 0; i < rows.length; i += step) ws.push(bodyWidth(text(c, rows[i]), k, !!c.cell));
	ws.sort((a, b) => a - b);
	return Math.round(Math.min(380 * k, Math.max(72 * k, headWidth(c.label, k), ws[Math.floor(ws.length * 0.95)] ?? 0)));
}
/** lebar pas untuk semua isi (klik ganda pada garis batas kolom) */
export function fitWidth<T>(c: Col<T>, rows: T[]): number {
	const k = remScale();
	let w = headWidth(c.label, k);
	for (const r of rows.slice(0, 5000)) w = Math.max(w, bodyWidth(text(c, r), k, !!c.cell));
	return Math.round(Math.min(640 * k, Math.max(64, w)));
}

/* ---------------- preferensi tersimpan ---------------- */
export type Density = 'cozy' | 'compact';
export interface GridPrefs {
	order: string[];
	hidden: string[];
	widths: Record<string, number>;
	density: Density;
	/** null = belum pernah diatur → pakai urutan awal halaman */
	sort: SortKey[] | null;
	/** jumlah kolom (dari kiri) yang di-freeze; default 1 */
	freeze: number;
}
/** keadaan lengkap grid yang diingat: pengaturan + filter + kata cari */
export type GridSaved = GridPrefs & { filters: Record<string, FilterValue>; query: string };

export const blankPrefs = (): GridPrefs => ({ order: [], hidden: [], widths: {}, density: 'cozy', sort: null, freeze: 1 });

/*
 * Disimpan di sessionStorage: bertahan saat pindah menu & reload,
 * hilang saat tab/aplikasi ditutup → dibuka lagi = tampilan awal.
 */
let cleaned = false;
export function loadPrefs(key: string): GridSaved {
	const base: GridSaved = { ...blankPrefs(), filters: {}, query: '' };
	try {
		if (!cleaned) {
			// bersihkan sisa versi lama yang tersimpan permanen (localStorage, termasuk "tampilan tersimpan")
			cleaned = true;
			for (const k of Object.keys(localStorage)) if (k.startsWith('senja:grid:')) localStorage.removeItem(k);
		}
		const raw = sessionStorage.getItem(key);
		if (!raw) return base;
		const { views: _old, ...rest } = JSON.parse(raw);
		return { ...base, ...rest };
	} catch {
		return base;
	}
}
export function savePrefs(key: string, p: GridSaved) {
	try {
		sessionStorage.setItem(key, JSON.stringify(p));
	} catch {
		/* penyimpanan penuh / diblokir: abaikan */
	}
}

/** state halaman sederhana (periode, tab status, …) yang diingat selama aplikasi terbuka */
export function loadSession<T extends Record<string, any>>(key: string, init: T): T {
	try {
		const raw = sessionStorage.getItem(key);
		return raw ? { ...init, ...JSON.parse(raw) } : init;
	} catch {
		return init;
	}
}
export function saveSession(key: string, v: unknown) {
	try {
		sessionStorage.setItem(key, JSON.stringify(v));
	} catch {
		/* abaikan */
	}
}

/* ---------------- sorot hasil cari ---------------- */
const owners = new Map<symbol, Range[]>();
const canHighlight = () => typeof CSS !== 'undefined' && 'highlights' in CSS;

export function highlight(owner: symbol, roots: (Element | null | undefined)[], terms: string[]) {
	if (!canHighlight()) return;
	const ranges: Range[] = [];
	for (const root of terms.length ? roots : []) {
		if (!root) continue;
		const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		for (let n = walk.nextNode(); n; n = walk.nextNode()) {
			const s = n.nodeValue?.toLowerCase();
			if (!s) continue;
			for (const t of terms) {
				for (let i = s.indexOf(t); i >= 0; i = s.indexOf(t, i + t.length)) {
					const r = new Range();
					r.setStart(n, i);
					r.setEnd(n, i + t.length);
					ranges.push(r);
				}
			}
		}
	}
	if (ranges.length) owners.set(owner, ranges);
	else owners.delete(owner);
	const all = [...owners.values()].flat();
	if (all.length) CSS.highlights.set('grid-q', new Highlight(...all));
	else CSS.highlights.delete('grid-q');
}
