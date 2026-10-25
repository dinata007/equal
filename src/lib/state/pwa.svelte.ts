/**
 * Pasang aplikasi (PWA). Event `beforeinstallprompt` hanya dikirim browser sekali saat halaman dimuat,
 * jadi ditangkap di sini sejak awal (diimpor oleh layout root), bukan di halaman profil.
 */
import { browser } from '$app/env';

interface InstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** cara memasang di perangkat ini */
export type InstallRoute =
	| 'installed' // sedang dibuka sebagai aplikasi
	| 'prompt' // Chrome / Edge / Samsung: tombol Pasang
	| 'ios' // iPhone / iPad: Bagikan › Tambahkan ke Layar Utama
	| 'android' // Android tanpa event install (Chrome menunggu interaksi, atau sudah ter-install): menu ⋮ › Instal aplikasi
	| 'mac-safari' // Safari macOS: File › Add to Dock
	| 'firefox' // Firefox desktop belum bisa memasang PWA
	| 'insecure' // bukan HTTPS → browser menolak memasang
	| 'menu'; // lainnya: lewat menu browser

class Pwa {
	#prompt = $state<InstallPromptEvent | null>(null);
	standalone = $state(false);
	/** baru saja dipasang di sesi ini */
	installedNow = $state(false);
	canPrompt = $derived(!!this.#prompt);

	route = $derived.by<InstallRoute>(() => {
		if (this.standalone) return 'installed';
		if (this.#prompt) return 'prompt';
		if (!browser) return 'menu';
		const ua = navigator.userAgent;
		const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
		if (ios) return 'ios';
		if (!isSecureContext) return 'insecure';
		if (/Android/.test(ua)) return 'android';
		if (/Firefox\//.test(ua)) return 'firefox';
		if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return 'mac-safari';
		return 'menu';
	});

	constructor() {
		if (!browser) return;
		const mq = matchMedia('(display-mode: standalone)');
		this.standalone = mq.matches || (navigator as { standalone?: boolean }).standalone === true;
		mq.addEventListener('change', (e) => (this.standalone = e.matches));
		addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault(); // tampilkan dari tombol aplikasi, bukan mini-bar bawaan
			this.#prompt = e as InstallPromptEvent;
		});
		addEventListener('appinstalled', () => {
			this.#prompt = null;
			this.installedNow = true;
		});
	}

	/** tampilkan dialog pasang bawaan browser */
	async install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
		const e = this.#prompt;
		if (!e) return 'unavailable';
		await e.prompt();
		const { outcome } = await e.userChoice;
		// event hanya bisa dipakai sekali
		this.#prompt = null;
		if (outcome === 'accepted') this.installedNow = true;
		return outcome;
	}
}

export const pwa = new Pwa();
