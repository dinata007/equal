/**
 * Stok gudang Dashboard di browser: saldo awal bulan + mutasi bersih per hari dari /api/stok.
 * Stok pada tanggal mana pun = saldo awal + mutasi kumulatif sampai tanggal itu.
 */
import { api } from '#lib/util/api.ts';
import { monthStart } from '#lib/util/format.ts';

interface Raw {
	at: string;
	anchor: string;
	ready: boolean;
	awal: [number, number];
	days: [string, number, number][];
}

export interface Level {
	qty: number;
	nilai: number;
}

export class Stock {
	readonly at: Date;
	readonly from: string;
	readonly to: string;
	private anchor: string;
	private ready: boolean;
	private awal: Level;
	/** tanggal (urut naik) dan stok kumulatif akhir hari itu */
	private dates: string[] = [];
	private levels: Level[] = [];

	constructor(raw: Raw, from: string, to: string) {
		this.at = new Date(raw.at);
		this.from = from;
		this.to = to;
		this.anchor = raw.anchor;
		this.ready = raw.ready;
		this.awal = { qty: raw.awal[0], nilai: raw.awal[1] };
		let qty = this.awal.qty;
		let nilai = this.awal.nilai;
		for (const [d, q, v] of [...raw.days].sort((a, b) => a[0].localeCompare(b[0]))) {
			qty += q;
			nilai += v;
			this.dates.push(d);
			this.levels.push({ qty, nilai });
		}
	}

	covers(from: string, to: string) {
		return this.from <= monthStart(from) && this.to >= to;
	}

	/** stok akhir hari `date`; null bila saldo awal bulan itu belum ada di database */
	level(date: string): Level | null {
		if (!this.ready || date < this.anchor) return null;
		// mutasi terakhir pada atau sebelum `date` (pencarian biner)
		let lo = 0;
		let hi = this.dates.length;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (this.dates[mid] <= date) lo = mid + 1;
			else hi = mid;
		}
		return lo ? this.levels[lo - 1] : this.awal;
	}
}

const cache = new Map<string, Promise<Stock>>();

export function loadStock(from: string, to: string, fresh = false): Promise<Stock> {
	const key = from + '|' + to;
	const hit = cache.get(key);
	if (hit && !fresh) return hit;
	const p = api<Raw>(`/api/stok?from=${from}&to=${to}${fresh ? '&fresh=1' : ''}`).then((raw) => new Stock(raw, from, to));
	cache.set(key, p);
	if (cache.size > 6) cache.delete(cache.keys().next().value!);
	p.catch(() => cache.get(key) === p && cache.delete(key));
	return p;
}
