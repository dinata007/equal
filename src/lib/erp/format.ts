const nf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const mf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const df = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const mlf = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });

export const num = (v: unknown) => nf.format(Number(v) || 0);
export const money = (v: unknown) => mf.format(Math.round(Number(v) || 0));
export const rp = (v: unknown) => 'Rp ' + money(v);
export const compact = (v: number) =>
	new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export function date(v?: string) {
	if (!v) return '';
	const d = new Date(v.length === 10 ? v + 'T00:00:00' : v);
	return isNaN(+d) ? v : df.format(d);
}
export const monthLabel = (ym: string) => mlf.format(new Date(ym + '-01T00:00:00'));

/** yyyy-mm-dd waktu lokal */
export function iso(d = new Date()) {
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const today = () => iso();
export function addDays(s: string, n: number) {
	const d = new Date(s + 'T00:00:00');
	d.setDate(d.getDate() + n);
	return iso(d);
}
export const monthStart = (s = today()) => s.slice(0, 8) + '01';
export function monthEnd(ym: string) {
	const [y, m] = ym.split('-').map(Number);
	return iso(new Date(y, m, 0));
}

export const uid = () =>
	Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function initials(name = '') {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((s) => s[0].toUpperCase())
		.join('');
}

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
	const esc = (v: unknown) => {
		const s = String(v ?? '');
		return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	const csv = [header, ...rows].map((r) => r.map(esc).join(';')).join('\n');
	const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
