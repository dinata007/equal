/**
 * Posisi stok toko dashboard, dihitung server dari saldo awal dan mutasi aplikasi lama.
 */
import { api } from '#lib/util/api.ts';

interface Raw {
	at: string;
	date: string;
	ready: boolean;
	balance: [number, number];
	categories: [string, string, number, number][];
}

export interface Level {
	qty: number;
	nilai: number;
}

export class Stock {
	readonly at: Date;
	readonly from: string;
	readonly to: string;
	readonly categories: { id: string; name: string; qty: number; nilai: number }[];
	private date: string;
	private ready: boolean;
	private balance: Level;

	constructor(raw: Raw, from: string, to: string) {
		this.at = new Date(raw.at);
		this.from = from;
		this.to = to;
		this.date = raw.date;
		this.ready = raw.ready;
		this.balance = { qty: raw.balance[0], nilai: raw.balance[1] };
		this.categories = raw.categories.map(([id, name, qty, nilai]) => ({ id, name, qty, nilai }));
	}

	/** Stok akhir pada tanggal yang diminta; null bila periode tidak punya saldo awal */
	level(date: string): Level | null {
		return this.ready && date === this.date ? this.balance : null;
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
