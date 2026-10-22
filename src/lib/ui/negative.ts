/**
 * Angka negatif tampil merah di seluruh aplikasi, tanpa mengubah tiap halaman:
 * elemen angka (`.num` / `.tabular-nums`) yang teksnya diawali minus diberi atribut `data-neg`,
 * lalu CSS mewarnainya. Dipantau dengan MutationObserver (digabung per frame) sehingga
 * ikut menyesuaikan saat data, filter, atau scroll virtual berubah.
 */
import type { Attachment } from 'svelte/attachments';

// "-1.000", "−1.000", "Rp -1.000", "Rp −1.000"
const NEG = /^(Rp\s*)?[-−]\s*\d/;

export const negativeRed: Attachment<HTMLElement> = (root) => {
	let raf = 0;
	const scan = () => {
		for (const el of root.querySelectorAll<HTMLElement>('.num, .tabular-nums')) {
			el.toggleAttribute('data-neg', NEG.test(el.textContent?.trim() ?? ''));
		}
	};
	const mo = new MutationObserver(() => {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(scan);
	});
	// atribut tidak dipantau → menandai data-neg tidak memicu putaran ulang
	mo.observe(root, { subtree: true, childList: true, characterData: true });
	scan();
	return () => {
		mo.disconnect();
		cancelAnimationFrame(raf);
	};
};
