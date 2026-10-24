/**
 * Tombol back (HP / browser) menutup lapisan paling atas — sheet, dialog, drawer menu, dropdown —
 * alih-alih meninggalkan halaman. Setiap lapisan terbuka = satu entri riwayat shallow
 * (`page.state.layers` = jumlah lapisan), jadi back menutup satu lapisan per tekan.
 *   komponen:     backClose(() => open, () => (open = false))
 *   root layout:  installBackClose()  (sekali)
 * Lapisan yang ditutup lewat UI (Batal, ×, Esc, pilih opsi) menarik entrinya kembali dengan history.go,
 * kecuali bila ditutup karena pindah halaman (entri lama ditinggal, halaman baru mulai dari 0).
 */
import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
import { page } from '$app/state';
import { untrack } from 'svelte';

interface Layer {
	isOpen: () => boolean;
	close: () => void;
}

const stack: Layer[] = [];
/** semua lapisan yang terdaftar & sedang terbuka (termasuk yang dilepas saat pindah halaman) */
const live = new Set<Layer>();
/** nilai page.state.layers di bawah lapisan pertama (bukan 0 bila halaman dibuka ulang di entri lapisan) */
let base = 0;
/** nilai page.state.layers yang dituju setelah push/back yang sedang berjalan */
let expected = 0;
/** history.go sedang berjalan → tunggu sampai page.state.layers = expected */
let settling = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let fallback: ReturnType<typeof setTimeout> | undefined;
let installed = false;

const depth = () => page.state.layers ?? 0;

/** samakan jumlah entri riwayat dengan jumlah lapisan terbuka */
function sync() {
	if (settling) return;
	const want = base + stack.length;
	if (want > expected) {
		for (let n = expected + 1; n <= want; n++) void goto(page.url.href, { shallow: true, state: { ...page.state, layers: n } });
		expected = want;
	} else if (want < expected) {
		settling = true;
		history.go(want - expected);
		expected = want;
		// jaga-jaga popstate tidak datang (mis. riwayat dipotong browser)
		fallback = setTimeout(() => ((settling = false), (expected = depth())), 1000);
	}
}

/**
 * setTimeout, bukan microtask: klik link yang sekaligus menutup lapisan (menu di drawer, command palette)
 * sempat memicu beforeNavigate dulu, sehingga lapisan dilepas tanpa history.go yang membatalkan navigasi.
 */
function schedule() {
	clearTimeout(timer);
	timer = setTimeout(sync);
}

function onDepth(d: number) {
	if (settling) {
		if (d !== expected) return;
		settling = false;
		clearTimeout(fallback);
		schedule();
		return;
	}
	if (d < expected) {
		// back oleh pengguna: tutup lapisan teratas sampai jumlahnya cocok
		expected = d;
		while (stack.length && base + stack.length > d) stack.pop()!.close();
	} else expected = d;
}

/** pasang sekali di root layout: pantau page.state.layers & lepas semua lapisan saat pindah halaman */
export function installBackClose() {
	if (installed) return;
	installed = true;
	expected = depth();
	$effect(() => {
		const d = depth();
		untrack(() => onDepth(d));
	});
	beforeNavigate((nav) => {
		if (nav.shallow || nav.type === 'popstate' || nav.type === 'leave') return;
		// pindah halaman: lapisan ditutup komponennya sendiri, entri riwayatnya tidak ditarik
		stack.length = 0;
		base = expected = 0;
		settling = false;
		clearTimeout(timer);
		clearTimeout(fallback);
	});
	afterNavigate((nav) => {
		// shallow = entri lapisan milik modul ini sendiri
		if (nav.shallow || nav.type === 'enter' || nav.type === 'popstate') return;
		// lapisan yang tetap terbuka melewati perpindahan (mis. sheet password sementara setelah simpan) didaftarkan lagi
		setTimeout(() => {
			if (stack.length || settling) return;
			for (const l of live) if (l.isOpen()) stack.push(l);
			if (!stack.length) return;
			base = depth();
			schedule();
		});
	});
}

/** daftarkan lapisan komponen: selama `isOpen()` benar, back menutupnya lewat `close()` */
export function backClose(isOpen: () => boolean, close: () => void) {
	const layer: Layer = { isOpen, close };
	$effect(() => {
		if (!isOpen()) return;
		untrack(() => {
			if (!stack.length && !settling) base = depth();
			stack.push(layer);
			live.add(layer);
			schedule();
		});
		// tertutup lewat UI / komponen dilepas → tarik entrinya (tidak apa-apa bila sudah dilepas oleh back)
		return () => {
			live.delete(layer);
			const i = stack.indexOf(layer);
			if (i < 0) return;
			stack.splice(i, 1);
			schedule();
		};
	});
}
