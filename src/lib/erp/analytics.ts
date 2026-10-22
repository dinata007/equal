import { db } from './db.svelte';
import { addDays } from './format';
import type { Doc, Row } from './types';

/** id channel untuk penjualan grosir (sales order), selain id toko */
export const GROSIR = 'grosir';

export interface SaleLine {
	date: string;
	docId: string;
	channel: string; // nama toko / "Grosir"
	channelId: string; // id toko / GROSIR
	customerId: string;
	payment: string;
	itemId: string;
	category: string;
	qty: number;
	amount: number; // setelah diskon baris, proporsional diskon dokumen
	cost: number; // qty × harga beli
}

/** Seluruh baris penjualan posted (POS toko + penjualan grosir) dalam periode */
export function saleLines(from: string, to: string): SaleLine[] {
	const out: SaleLine[] = [];
	const products = new Map(db.all('products').map((p) => [p.id, p]));
	const push = (d: Doc, channel: string, channelId: string, payment: string) => {
		const gross = d.lines.reduce((s, l) => s + (+l.qty || 0) * (+l.price || 0) * (1 - (+l.disc || 0) / 100), 0);
		const ratio = gross ? (gross - (d.discount ?? 0)) / gross : 1;
		for (const l of d.lines) {
			const p = products.get(l.itemId);
			const qty = +l.qty || 0;
			out.push({
				date: d.date,
				docId: d.id,
				channel,
				channelId,
				customerId: d.customerId,
				payment,
				itemId: l.itemId,
				category: p?.category ?? '-',
				qty,
				amount: qty * (+l.price || 0) * (1 - (+l.disc || 0) / 100) * ratio,
				cost: qty * (p?.buyPrice ?? 0)
			});
		}
	};
	for (const d of db.all<Doc>('store_sales'))
		if (d.status === 'posted' && d.date >= from && d.date <= to) push(d, db.name('stores', d.storeId), d.storeId, d.payment);
	for (const d of db.all<Doc>('sales_orders'))
		if (d.status === 'posted' && d.date >= from && d.date <= to) push(d, 'Grosir / Corporate', GROSIR, 'Kredit');
	return out;
}

export function groupSum<T>(rows: T[], key: (r: T) => string, val: (r: T) => number) {
	const m = new Map<string, number>();
	for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
	return [...m.entries()].map(([k, v]) => ({ key: k, value: v })).sort((a, b) => b.value - a.value);
}

export function daily(rows: SaleLine[], from: string, to: string) {
	const m = new Map<string, number>();
	for (const r of rows) m.set(r.date, (m.get(r.date) ?? 0) + r.amount);
	const out: { key: string; value: number }[] = [];
	for (let d = from; d <= to; d = addDays(d, 1)) out.push({ key: d, value: m.get(d) ?? 0 });
	return out;
}

/** Ringkasan angka penjualan */
export function saleStats(rows: SaleLine[]) {
	let sales = 0;
	let qty = 0;
	let cost = 0;
	const docs = new Set<string>();
	for (const r of rows) {
		sales += r.amount;
		qty += r.qty;
		cost += r.cost;
		docs.add(r.docId);
	}
	const trx = docs.size;
	return { sales, qty, cost, trx, avg: trx ? sales / trx : 0, profit: sales - cost, margin: sales ? ((sales - cost) / sales) * 100 : 0 };
}
export type SaleStats = ReturnType<typeof saleStats>;

/** Rentang tanggal [from, to] dipotong per `size` hari, dimulai dari `from` */
export function buckets(from: string, to: string, size: number) {
	const out: { from: string; to: string }[] = [];
	for (let d = from; d <= to; d = addDays(d, size)) {
		const end = addDays(d, size - 1);
		out.push({ from: d, to: end < to ? end : to });
	}
	return out;
}

/** Statistik per bucket (urutan sama dengan `bs`) */
export function bucketStats(rows: SaleLine[], bs: { from: string; to: string }[]) {
	const groups: SaleLine[][] = bs.map(() => []);
	for (const r of rows) {
		const i = bs.findIndex((b) => r.date >= b.from && r.date <= b.to);
		if (i >= 0) groups[i].push(r);
	}
	return groups.map(saleStats);
}

/** Persentase perubahan; null bila pembanding kosong */
export const pctChange = (cur: number, prev: number) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : null);

/** Urutan tetap kategori produk (warna mengikuti entitas, bukan peringkat) */
export const categoryOrder = () => [...new Set(db.all<Row>('products').map((p) => p.category as string))];
