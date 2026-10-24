/**
 * Deret tab yang bisa digeser ke samping (HP), sebagai Svelte attachment:
 *   <div class="scroll-tabs" role="tablist" {@attach scrollTabs()}>
 * - tanpa scrollbar; tepi memudar hanya bila masih ada tab di sisi itu (data-fade di-set di sini, gaya di app.css)
 * - tab terpilih (aria-selected, atau link aria-current="page") digeser ke tengah saat dibuka & saat berganti
 */
import type { Attachment } from 'svelte/attachments';

export function scrollTabs(): Attachment<HTMLElement> {
	return (node) => {
		function fade() {
			const max = node.scrollWidth - node.clientWidth;
			const left = node.scrollLeft > 1;
			const right = node.scrollLeft < max - 1;
			node.dataset.fade = left && right ? 'both' : left ? 'start' : right ? 'end' : '';
		}
		function center(smooth: boolean) {
			const tab = node.querySelector<HTMLElement>('[aria-selected="true"], [aria-current="page"]');
			if (!tab || node.scrollWidth <= node.clientWidth) return;
			// posisi relatif ke deret (bukan offsetLeft: itu relatif ke induk ber-position, bisa pembungkus tab sendiri)
			const t = tab.getBoundingClientRect();
			const n = node.getBoundingClientRect();
			const left = node.scrollLeft + (t.left - n.left) - (node.clientWidth - t.width) / 2;
			node.scrollTo({ left, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' });
		}

		center(false);
		fade();
		node.addEventListener('scroll', fade, { passive: true });
		const ro = new ResizeObserver(fade);
		ro.observe(node);
		// tab berganti → aria-selected / aria-current berubah; tab bertambah/berkurang → tepi pudar dihitung ulang
		const mo = new MutationObserver((records) => {
			if (records.some((r) => r.type === 'attributes')) center(true);
			fade();
		});
		mo.observe(node, { subtree: true, childList: true, attributeFilter: ['aria-selected', 'aria-current'] });
		return () => {
			node.removeEventListener('scroll', fade);
			ro.disconnect();
			mo.disconnect();
		};
	};
}
