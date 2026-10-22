import { db } from './db.svelte';
import { addDays } from './format';
import type { Doc } from './types';

export interface SaleLine {
	date: string;
	docId: string;
	channel: string; // nama toko / "Grosir"
	payment: string;
	itemId: string;
	qty: number;
	amount: number; // setelah diskon baris, proporsional diskon dokumen
}

/** Seluruh baris penjualan posted (POS toko + penjualan grosir) dalam periode */
export function saleLines(from: string, to: string): SaleLine[] {
	const out: SaleLine[] = [];
	const push = (d: Doc, channel: string, payment: string) => {
		const gross = d.lines.reduce((s, l) => s + (+l.qty || 0) * (+l.price || 0) * (1 - (+l.disc || 0) / 100), 0);
		const ratio = gross ? (gross - (d.discount ?? 0)) / gross : 1;
		for (const l of d.lines)
			out.push({ date: d.date, docId: d.id, channel, payment, itemId: l.itemId, qty: +l.qty || 0, amount: (+l.qty || 0) * (+l.price || 0) * (1 - (+l.disc || 0) / 100) * ratio });
	};
	for (const d of db.all<Doc>('store_sales'))
		if (d.status === 'posted' && d.date >= from && d.date <= to) push(d, db.name('stores', d.storeId), d.payment);
	for (const d of db.all<Doc>('sales_orders'))
		if (d.status === 'posted' && d.date >= from && d.date <= to) push(d, 'Grosir / Corporate', 'Kredit');
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
