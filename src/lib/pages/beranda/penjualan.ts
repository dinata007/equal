/**
 * Data penjualan Dashboard di browser: diambil sekali per sesi aplikasi dari /api/penjualan (pindah halaman tidak
 * memuat ulang), tombol muat ulang meminta data terbaru. Semua penjumlahan & filter dihitung di sini.
 */
import { api } from '#lib/util/api.ts';
import { addDays } from '#lib/util/format.ts';

export const GROSIR = 'GROSIR';

export interface Channel {
	id: string;
	name: string;
	city: string;
}
export interface Sale {
	date: string;
	ch: string;
	cat: string;
	item: string;
	qty: number;
	amount: number;
}
interface Docs {
	date: string;
	ch: string;
	cat: string;
	n: number;
}
interface Raw {
	at: string;
	channels: Channel[];
	rows: [string, string, string, string, number, number][];
	docs: [string, string, string, number][];
}

export class Sales {
	readonly at: Date;
	/** rentang yang dimuat dari server */
	readonly from: string;
	readonly to: string;
	readonly channels: Channel[];
	/** kategori urut tetap (warna mengikuti entitas, bukan peringkat) */
	readonly categories: string[];
	private rows = new Map<string, Sale[]>();
	private docs = new Map<string, Docs[]>();

	constructor(raw: Raw, from: string, to: string) {
		this.at = new Date(raw.at);
		this.from = from;
		this.to = to;
		this.channels = [...raw.channels].sort((a, b) => (a.id === GROSIR ? -1 : b.id === GROSIR ? 1 : a.name.localeCompare(b.name)));
		const total = new Map<string, number>();
		for (const [date, ch, cat, item, qty, amount] of raw.rows) {
			(this.rows.get(date) ?? this.rows.set(date, []).get(date)!).push({ date, ch, cat, item, qty, amount });
			total.set(cat, (total.get(cat) ?? 0) + amount);
		}
		for (const [date, ch, cat, n] of raw.docs) (this.docs.get(date) ?? this.docs.set(date, []).get(date)!).push({ date, ch, cat, n });
		this.categories = [...total].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
	}

	covers(from: string, to: string) {
		return this.from <= from && this.to >= to;
	}

	/** baris & jumlah transaksi dalam rentang [from, to]; `channel`/`category` kosong = semua */
	pick(from: string, to: string, channel = '', category = ''): Slice {
		const rows: Sale[] = [];
		let trx = 0;
		for (let d = from; d <= to; d = addDays(d, 1)) {
			for (const r of this.rows.get(d) ?? []) if ((!channel || r.ch === channel) && (!category || r.cat === category)) rows.push(r);
			// transaksi berbeda: bila kategori dipilih, hitung per kategori itu; bila tidak, per dokumen utuh
			for (const x of this.docs.get(d) ?? []) if (x.cat === category && (!channel || x.ch === channel)) trx += x.n;
		}
		return { rows, trx };
	}
}

export interface Slice {
	rows: Sale[];
	trx: number;
}

export function stats({ rows, trx }: Slice) {
	let sales = 0;
	let qty = 0;
	for (const r of rows) {
		sales += r.amount;
		qty += r.qty;
	}
	return { sales, qty, trx };
}
export type Stats = ReturnType<typeof stats>;

/** Rentang tanggal [from, to] dipotong per `size` hari, dimulai dari `from` */
export function buckets(from: string, to: string, size: number) {
	const out: { from: string; to: string }[] = [];
	for (let d = from; d <= to; d = addDays(d, size)) {
		const end = addDays(d, size - 1);
		out.push({ from: d, to: end < to ? end : to });
	}
	return out;
}

/** Persentase perubahan; null bila pembanding kosong */
export const pctChange = (cur: number, prev: number) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : null);

/* ---------------- muat ---------------- */

/** panjang rentang terpanjang yang boleh dipilih (hari); server menerima maks. 400 hari termasuk pembandingnya */
export const MAX_DAYS = 190;
/** data terlama di database lama */
export const MIN_DATE = '2020-07-01';

const cache = new Map<string, Promise<Sales>>();

export function loadSales(from: string, to: string, fresh = false): Promise<Sales> {
	const key = from + '|' + to;
	const hit = cache.get(key);
	if (hit && !fresh) return hit;
	const p = api<Raw>(`/api/penjualan?from=${from}&to=${to}${fresh ? '&fresh=1' : ''}`).then((raw) => new Sales(raw, from, to));
	cache.set(key, p);
	if (cache.size > 6) cache.delete(cache.keys().next().value!);
	p.catch(() => cache.get(key) === p && cache.delete(key));
	return p;
}
