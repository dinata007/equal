/**
 * Data Dashboard 2 di browser: diambil sekali per sesi aplikasi (pindah tab/halaman tidak memuat ulang),
 * tombol muat ulang meminta data terbaru dari server. Semua penjumlahan & filter dihitung di browser.
 */
import { api } from '#lib/util/api.ts';
import { monthLabel } from '#lib/util/format.ts';

export type Rec = Record<string, any>;
export interface Loaded {
	at: string;
	db: string;
	rows: Rec[];
}

const cache = new Map<string, Promise<Loaded>>();

export function loadSet(sumber: string, set: string, fresh = false): Promise<Loaded> {
	const key = `${sumber}:${set}`;
	const hit = cache.get(key);
	if (hit && !fresh) return hit;
	const p = api<{ at: string; db: string; cols: string[]; rows: unknown[][] }>(`/api/dashboard/${sumber}?set=${set}${fresh ? '&fresh=1' : ''}`).then((d) => ({
		at: d.at,
		db: d.db,
		rows: d.rows.map((r) => Object.fromEntries(d.cols.map((c, i) => [c, r[i]])))
	}));
	cache.set(key, p);
	p.catch(() => cache.get(key) === p && cache.delete(key));
	return p;
}

/* ---------------- agregasi ---------------- */

/** jumlah per nilai dimensi */
export function sumBy(rows: Rec[], key: string, val: (r: Rec) => number) {
	const m = new Map<string, number>();
	for (const r of rows) m.set(r[key], (m.get(r[key]) ?? 0) + val(r));
	return m;
}
export const total = (rows: Rec[], val: (r: Rec) => number) => rows.reduce((s, r) => s + val(r), 0);

/** urutan entitas berdasar total seluruh data (bukan periode terpilih) → warnanya tetap saat filter berganti */
export function stableOrder(rows: Rec[], key: string, val: (r: Rec) => number) {
	return [...sumBy(rows, key, (r) => Math.abs(val(r)))].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
}

/** warna kategori: 5 slot tetap; entitas ke-6 dst. ikut warna "lainnya" */
export const SLOTS = 5;
export const colorAt = (i: number) => (i >= 0 && i < SLOTS ? `var(--viz-${i + 1})` : 'var(--viz-muted)');

/* ---------------- periode ---------------- */

export const daysIn = (ym: string) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate();
export function prevYm(ym: string) {
	const y = Number(ym.slice(0, 4));
	const m = Number(ym.slice(5, 7));
	return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}
export const ymLabel = (ym: string) => monthLabel(ym).replace(/^./, (c) => c.toUpperCase());
const SHORT_MONTH = new Intl.DateTimeFormat('id-ID', { month: 'short' });
export const dayLabel = (ym: string, d: number) => `${d} ${SHORT_MONTH.format(new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, d))}`;
export const nowYm = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
