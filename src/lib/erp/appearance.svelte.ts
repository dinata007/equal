/**
 * Tampilan aplikasi per pengguna: mode (light/dark/system) & ukuran teks.
 * - diterapkan langsung ke <html> (class dark, font-size)
 * - disalin ke localStorage agar halaman berikutnya tidak berkedip (lihat skrip di app.html)
 * - disimpan ke akun (PUT /api/profil) → ikut ke semua perangkat; data akun menang saat login
 */
import { browser } from '$app/env';
import { api } from './api';
import { cleanPrefs, DEFAULT_PREFS, samePrefs, TEXT_SIZES, type UiPrefs } from './prefs';

const KEY = 'senja:prefs';
const SAVE_DELAY = 700;
const osDark = browser ? matchMedia('(prefers-color-scheme: dark)') : null;
const osReduce = browser ? matchMedia('(prefers-reduced-motion: reduce)') : null;

function readLocal(): UiPrefs {
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) return cleanPrefs(JSON.parse(raw));
		// versi lama hanya menyimpan tema
		const legacy = localStorage.getItem('senja:theme');
		return { ...DEFAULT_PREFS, theme: legacy === 'dark' || legacy === 'light' ? legacy : 'system' };
	} catch {
		return { ...DEFAULT_PREFS };
	}
}

export type SyncState = 'idle' | 'saving' | 'saved' | 'error';

class Appearance {
	prefs = $state<UiPrefs>(browser ? readLocal() : { ...DEFAULT_PREFS });
	systemDark = $state(!!osDark?.matches);
	dark = $derived(this.prefs.theme === 'dark' || (this.prefs.theme === 'system' && this.systemDark));
	isDefault = $derived(samePrefs(this.prefs, DEFAULT_PREFS));
	sync = $state<SyncState>('idle');
	/** sudah login → perubahan disimpan ke akun */
	#account = false;
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor() {
		if (!browser) return;
		osDark!.addEventListener('change', (e) => {
			this.systemDark = e.matches;
			this.#apply();
		});
	}

	/** ubah sebagian preferensi; `from` = titik klik untuk animasi lingkaran saat tema berganti */
	set(patch: Partial<UiPrefs>, from?: { x: number; y: number }) {
		const next = cleanPrefs({ ...this.prefs, ...patch });
		if (samePrefs(next, this.prefs)) return;
		const wasDark = this.dark;
		const update = () => {
			this.prefs = next;
			this.#apply();
		};
		const themeFlip = (next.theme === 'dark' || (next.theme === 'system' && this.systemDark)) !== wasDark;
		if (themeFlip && from) reveal(update, from);
		else update();
		this.#store();
	}

	toggleDark(from?: { x: number; y: number }) {
		this.set({ theme: this.dark ? 'light' : 'dark' }, from);
	}

	reset() {
		this.set({ ...DEFAULT_PREFS });
	}

	/** kirim ulang setelah gagal menyimpan */
	retry() {
		if (this.#account) this.#queue();
	}

	/** dipanggil setiap data sesi berubah (login, invalidateAll) */
	syncAccount(user: { prefs: UiPrefs | null } | null) {
		this.#account = !!user;
		if (!user) return;
		// ada perubahan yang belum terkirim → jangan ditimpa data lama dari server
		if (this.#timer || this.sync === 'saving') return;
		if (user.prefs) {
			if (!samePrefs(user.prefs, this.prefs)) {
				this.prefs = user.prefs;
				this.#apply();
				this.#local();
			}
		} else if (!this.isDefault) this.#queue(); // pertama kali: bawa pengaturan perangkat ini ke akun
	}

	#apply() {
		const html = document.documentElement;
		const p = this.prefs;
		html.classList.toggle('dark', this.dark);
		const scale = TEXT_SIZES.find((t) => t.id === p.textSize)!.scale;
		html.style.fontSize = scale === 100 ? '' : `${scale}%`;
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', this.dark ? '#0c0a09' : '#f2f1ef');
	}

	#local() {
		try {
			localStorage.setItem(KEY, JSON.stringify(this.prefs));
			localStorage.removeItem('senja:theme');
		} catch {}
	}

	#store() {
		this.#local();
		if (this.#account) this.#queue();
	}

	#queue() {
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => this.#save(), SAVE_DELAY);
	}

	async #save() {
		this.#timer = undefined;
		const sent = $state.snapshot(this.prefs);
		this.sync = 'saving';
		try {
			await api('/api/profil', { method: 'PUT', body: { prefs: sent } });
			// diubah lagi selama menyimpan → kirim versi terbaru
			if (!samePrefs(sent, this.prefs)) return this.#queue();
			this.sync = 'saved';
		} catch {
			this.sync = 'error';
		}
	}
}

/** ganti tema dengan lingkaran yang meluas dari titik klik (View Transitions API) */
function reveal(update: () => void, { x, y }: { x: number; y: number }) {
	if (!document.startViewTransition || osReduce?.matches) return update();
	const html = document.documentElement;
	html.classList.add('theme-vt');
	const t = document.startViewTransition(update);
	const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
	t.ready
		.then(() =>
			html.animate(
				{ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
				{ duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }
			)
		)
		.catch(() => {});
	t.finished.finally(() => html.classList.remove('theme-vt'));
}

/** titik tengah elemen yang diklik (untuk animasi tema) */
export const clickPoint = (e: MouseEvent) => {
	if (e.clientX || e.clientY) return { x: e.clientX, y: e.clientY };
	const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
	return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

export const appearance = new Appearance();
