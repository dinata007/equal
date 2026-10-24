const nf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const mf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const df = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const mlf = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });

export const num = (v: unknown) => nf.format(Number(v) || 0);
export const money = (v: unknown) => mf.format(Math.round(Number(v) || 0));
export const rp = (v: unknown) => 'Rp ' + money(v);
/** angka ringkas gaya Indonesia: 950 rb · 12,5 jt · 1,2 M */
export function short(v: number) {
	const a = Math.abs(v);
	const f = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 1 });
	if (a >= 1e9) return f(v / 1e9) + ' M';
	if (a >= 1e6) return f(v / 1e6) + ' jt';
	if (a >= 1e4) return f(v / 1e3) + ' rb';
	return money(v);
}
export const rpShort = (v: number) => 'Rp ' + short(v);
export const compact = (v: number) =>
	new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export function date(v?: string) {
	if (!v) return '';
	const d = new Date(v.length === 10 ? v + 'T00:00:00' : v);
	return isNaN(+d) ? v : df.format(d);
}
export const monthLabel = (ym: string) => mlf.format(new Date(ym + '-01T00:00:00'));

const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });
const dtf = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
/** waktu relatif: "baru saja", "5 menit yang lalu", "kemarin"; lebih dari 30 hari → tanggal */
export function ago(v: string | null | undefined, now = Date.now()) {
	if (!v) return '';
	const s = Math.round((new Date(v).getTime() - now) / 1000);
	const a = Math.abs(s);
	if (a < 45) return 'baru saja';
	if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
	if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
	if (a < 30 * 86400) return rtf.format(Math.round(s / 86400), 'day');
	return dtf.format(new Date(v));
}
/** tanggal + jam lengkap (untuk tooltip) */
export const dateTime = (v: string) => dtf.format(new Date(v));

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

