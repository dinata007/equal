/**
 * Preferensi tampilan per pengguna (tersimpan di akun → ikut ke semua perangkat).
 * Dipakai bersama browser & server: server hanya menyimpan nilai yang ada di daftar ini.
 */
export type ThemeMode = 'light' | 'dark' | 'system';
export type TextSize = 'sm' | 'md' | 'lg' | 'xl';

export interface UiPrefs {
	theme: ThemeMode;
	textSize: TextSize;
}

export const DEFAULT_PREFS: UiPrefs = { theme: 'system', textSize: 'md' };

export const THEMES: { id: ThemeMode; label: string }[] = [
	{ id: 'light', label: 'Light' },
	{ id: 'dark', label: 'Dark' },
	{ id: 'system', label: 'System' }
];

/** persen ukuran font dasar <html> (semua ukuran rem ikut berskala) */
export const TEXT_SIZES: { id: TextSize; label: string; scale: number }[] = [
	{ id: 'sm', label: 'Kecil', scale: 93.75 },
	{ id: 'md', label: 'Normal', scale: 100 },
	{ id: 'lg', label: 'Besar', scale: 106.25 },
	{ id: 'xl', label: 'Sangat besar', scale: 112.5 }
];

const pick = <T extends string>(v: unknown, list: { id: T }[], fallback: T): T => (list.some((o) => o.id === v) ? (v as T) : fallback);

/** nilai tak dikenal → bawaan (data dari browser/database lama tidak dipercaya; pilihan lama seperti font diabaikan) */
export function cleanPrefs(raw: unknown): UiPrefs {
	const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	return {
		theme: pick(r.theme, THEMES, DEFAULT_PREFS.theme),
		textSize: pick(r.textSize, TEXT_SIZES, DEFAULT_PREFS.textSize)
	};
}

export const samePrefs = (a: UiPrefs, b: UiPrefs) => (Object.keys(DEFAULT_PREFS) as (keyof UiPrefs)[]).every((k) => a[k] === b[k]);
