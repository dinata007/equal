/**
 * Mesin perhitungan: stok, piutang/hutang, kas-bank & jurnal dihitung dari dokumen
 * berstatus "posted" berdasarkan efek yang dideklarasikan di definisi transaksi.
 * Di tahap DB, fungsi-fungsi ini menjadi VIEW / stored procedure MSSQL.
 */
import { db } from './db.svelte';
import { monthEnd } from './format';
import { TX } from './menu';
import type { Doc, JournalLine, Row, TxDef } from './types';

export function computeTotals(def: TxDef, doc: Partial<Doc>) {
	const lines = doc.lines ?? [];
	const subtotal = def.lines?.amount ? lines.reduce((s, l) => s + def.lines!.amount!(l), 0) : 0;
	const discount = def.totals?.discount ? Number(doc.discount) || 0 : 0;
	const taxRate = def.totals?.tax ? Number(doc.taxRate) || 0 : 0;
	const tax = Math.round(((subtotal - discount) * taxRate) / 100);
	return { subtotal, discount, tax, total: subtotal - discount + tax };
}

const byDate = <T extends { date: string; no: string }>(a: T, b: T) =>
	a.date < b.date ? -1 : a.date > b.date ? 1 : a.no < b.no ? -1 : 1;

/* ---------------- Stok ---------------- */
export interface StockMove {
	date: string;
	no: string;
	docId: string;
	path: string;
	label: string;
	itemId: string;
	loc: string;
	qty: number;
}
export const locMatch = (scope: string, storeId?: string) => (loc: string) =>
	scope === 'TOKO' ? (storeId ? loc === 'TOKO:' + storeId : loc.startsWith('TOKO:')) : loc === scope;

export function stockMoves(itemTable: string, locFilter?: (loc: string) => boolean, excludeDocId?: string): StockMove[] {
	const out: StockMove[] = [];
	for (const t of TX) {
		const s = t.def.stock;
		if (!s || s.itemTable !== itemTable) continue;
		for (const d of db.all<Doc>(t.def.table)) {
			if (d.status !== 'posted' || d.id === excludeDocId) continue;
			const loc = s.loc(d);
			if (locFilter && !locFilter(loc)) continue;
			for (const l of d.lines) {
				const qty = s.qty(l);
				if (!qty || !l.itemId) continue;
				out.push({ date: d.date, no: d.no, docId: d.id, path: t.path, label: t.label, itemId: l.itemId, loc, qty });
			}
		}
	}
	// per tanggal: barang masuk didahulukan agar saldo berjalan tidak "minus semu"
	return out.sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.qty > 0 !== b.qty > 0 ? (a.qty > 0 ? -1 : 1) : a.no < b.no ? -1 : 1));
}

export function stockBalance(itemTable: string, loc: string, itemId: string, upTo?: string, excludeDocId?: string) {
	let q = 0;
	for (const m of stockMoves(itemTable, (l) => l === loc, excludeDocId))
		if (m.itemId === itemId && (!upTo || m.date <= upTo)) q += m.qty;
	return q;
}

/**
 * Stok yang boleh dikeluarkan pada tanggal `from`: saldo akhir hari terendah dari `from`
 * dan seterusnya, agar dokumen bertanggal mundur tidak membuat saldo sesudahnya minus.
 */
export function stockAvailable(itemTable: string, loc: string, itemId: string, from: string, excludeDocId?: string) {
	let q = 0;
	let min = Infinity;
	let day = '';
	for (const m of stockMoves(itemTable, (l) => l === loc, excludeDocId)) {
		if (m.itemId !== itemId) continue;
		// pergantian hari: q = saldo akhir `day`, berlaku untuk tanggal >= from yang belum lewat
		if (m.date !== day && (day >= from || m.date > from)) min = Math.min(min, q);
		day = m.date;
		q += m.qty;
	}
	return Math.min(min, q);
}

/** Saldo semua item per lokasi: Map<itemId, qty> */
export function stockOnHand(itemTable: string, locFilter: (loc: string) => boolean) {
	const map = new Map<string, number>();
	for (const m of stockMoves(itemTable, locFilter)) map.set(m.itemId, (map.get(m.itemId) ?? 0) + m.qty);
	return map;
}

export function stockMutation(itemTable: string, locFilter: (loc: string) => boolean, from: string, to: string) {
	const rows = new Map<string, { open: number; in: number; out: number }>();
	for (const m of stockMoves(itemTable, locFilter)) {
		if (m.date > to) continue;
		const r = rows.get(m.itemId) ?? { open: 0, in: 0, out: 0 };
		if (m.date < from) r.open += m.qty;
		else if (m.qty > 0) r.in += m.qty;
		else r.out += -m.qty;
		rows.set(m.itemId, r);
	}
	return db
		.all(itemTable)
		.map((item) => {
			const r = rows.get(item.id) ?? { open: 0, in: 0, out: 0 };
			return { item, ...r, close: r.open + r.in - r.out };
		})
		.sort((a, b) => String(a.item.code).localeCompare(String(b.item.code)));
}

/* ---------------- Piutang / Hutang ---------------- */
export interface PartyMove {
	date: string;
	no: string;
	docId: string;
	path: string;
	label: string;
	partyId: string;
	inc: number;
	dec: number;
	memo?: string;
	/** jatuh tempo dokumen penambah saldo (default: tanggal dokumen) */
	due: string;
}
export function partyMoves(kind: 'ar' | 'ap'): PartyMove[] {
	const out: PartyMove[] = [];
	for (const t of TX) {
		for (const e of t.def.ledger ?? []) {
			if (e.kind !== kind) continue;
			for (const d of db.all<Doc>(t.def.table)) {
				if (d.status !== 'posted' || (e.when && !e.when(d))) continue;
				const amt = d.total ?? 0;
				out.push({
					date: d.date,
					no: d.no,
					docId: d.id,
					path: t.path,
					label: t.label,
					partyId: d[e.partyField],
					inc: e.sign > 0 ? amt : 0,
					dec: e.sign < 0 ? amt : 0,
					memo: d.notes,
					due: d.dueDate || d.date
				});
			}
		}
	}
	return out.sort(byDate);
}

/** Dokumen piutang/hutang yang belum lunas; pelunasan & nota pengurang dialokasikan FIFO ke dokumen terlama */
export function openItems(kind: 'ar' | 'ap') {
	const queues = new Map<string, { m: PartyMove; left: number }[]>();
	for (const m of partyMoves(kind)) {
		const q = queues.get(m.partyId) ?? [];
		queues.set(m.partyId, q);
		if (m.inc) q.push({ m, left: m.inc });
		let d = m.dec;
		while (d > 0 && q.length) {
			const take = Math.min(d, q[0].left);
			q[0].left -= take;
			d -= take;
			if (q[0].left < 0.5) q.shift();
		}
	}
	return [...queues.values()].flat().map(({ m, left }) => ({ ...m, left }));
}

/* ---------------- Kas & Bank ---------------- */
export interface CashMove {
	date: string;
	no: string;
	docId: string;
	path: string;
	label: string;
	kasbankId: string;
	in: number;
	out: number;
	memo: string;
}
export function cashMoves(): CashMove[] {
	const out: CashMove[] = [];
	for (const t of TX) {
		const c = t.def.cash;
		if (!c) continue;
		for (const d of db.all<Doc>(t.def.table)) {
			if (d.status !== 'posted') continue;
			const amt = d.total ?? 0;
			out.push({
				date: d.date,
				no: d.no,
				docId: d.id,
				path: t.path,
				label: t.label,
				kasbankId: d[c.field],
				in: c.sign > 0 ? amt : 0,
				out: c.sign < 0 ? amt : 0,
				memo: d.from || d.to || d.lines.map((l) => l.desc).filter(Boolean).join(', ') || d.notes || ''
			});
		}
	}
	return out.sort(byDate);
}

/* ---------------- Jurnal ---------------- */
export interface JournalEntry {
	date: string;
	no: string;
	docId: string;
	path: string;
	label: string;
	memo: string;
	lines: JournalLine[];
}
export function journalEntries(): JournalEntry[] {
	const out: JournalEntry[] = [];
	for (const t of TX) {
		if (!t.def.journal) continue;
		for (const d of db.all<Doc>(t.def.table)) {
			if (d.status !== 'posted') continue;
			const lines = t.def.journal(d).filter((l) => l.debit || l.credit);
			if (lines.length) out.push({ date: d.date, no: d.no, docId: d.id, path: t.path, label: t.label, memo: d.memo || d.notes || '', lines });
		}
	}
	return out.sort(byDate);
}

/* ---------------- Closing ---------------- */
export interface Closing extends Row {
	scope: string;
	period: string; // yyyy-mm
	closedAt: string;
	closedBy: string;
}
export function lastClosing(scope: string) {
	return db
		.all<Closing>('closings')
		.filter((c) => c.scope === scope)
		.sort((a, b) => b.period.localeCompare(a.period))[0];
}
/** tanggal terakhir yang terkunci (inklusif) */
export function lockedUntil(scope?: string) {
	if (!scope) return '';
	const c = lastClosing(scope);
	return c ? monthEnd(c.period) : '';
}
