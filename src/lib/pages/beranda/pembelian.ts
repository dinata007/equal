/** Data pembelian Dashboard di browser (dari /api/pembelian), dipakai sebagai pembanding Tren Penjualan. */
import { api } from '#lib/util/api.ts';
import { addDays } from '#lib/util/format.ts';

interface Raw {
	at: string;
	rows: [string, string, number, number][];
}

export class Purchases {
	readonly at: Date;
	readonly from: string;
	readonly to: string;
	private byDate = new Map<string, { cat: string; nilai: number }[]>();

	constructor(raw: Raw, from: string, to: string) {
		this.at = new Date(raw.at);
		this.from = from;
		this.to = to;
		for (const [d, cat, , nilai] of raw.rows) (this.byDate.get(d) ?? this.byDate.set(d, []).get(d)!).push({ cat, nilai });
	}

	/** nilai pembelian dalam rentang [from, to]; `category` kosong = semua */
	sum(from: string, to: string, category = '') {
		let t = 0;
		for (let d = from; d <= to; d = addDays(d, 1)) for (const r of this.byDate.get(d) ?? []) if (!category || r.cat === category) t += r.nilai;
		return t;
	}
}

const cache = new Map<string, Promise<Purchases>>();

export function loadPurchases(from: string, to: string, fresh = false): Promise<Purchases> {
	const key = from + '|' + to;
	const hit = cache.get(key);
	if (hit && !fresh) return hit;
	const p = api<Raw>(`/api/pembelian?from=${from}&to=${to}${fresh ? '&fresh=1' : ''}`).then((raw) => new Purchases(raw, from, to));
	cache.set(key, p);
	if (cache.size > 6) cache.delete(cache.keys().next().value!);
	p.catch(() => cache.get(key) === p && cache.delete(key));
	return p;
}
