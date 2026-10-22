/**
 * Fondasi elemen melayang (dropdown, menu, tooltip):
 * - Popover API → tampil di top layer (tidak terpotong overflow/z-index)
 * - Floating UI → posisi otomatis flip/shift mengikuti ruang layar
 */
import { arrow, autoUpdate, computePosition, flip, offset, shift, size, type Placement } from '@floating-ui/dom';

export interface FloatOpts {
	placement?: Placement;
	gap?: number;
	/** samakan lebar minimal dengan anchor */
	matchWidth?: boolean;
	arrowEl?: HTMLElement | null;
	/** batasi tinggi agar muat di layar (daftar panjang); matikan untuk konten tinggi tetap seperti kalender */
	limitHeight?: boolean;
	/** batas tinggi maksimum saat limitHeight aktif (default 360) */
	maxHeight?: number;
}

/** Posisikan `floating` terhadap `anchor` dan terus mengikuti scroll/resize. Mengembalikan cleanup. */
export function float(anchor: Element, floating: HTMLElement, opts: FloatOpts = {}) {
	const { placement = 'bottom-start', gap = 6, matchWidth = false, arrowEl, limitHeight = true, maxHeight = 360 } = opts;
	return autoUpdate(anchor, floating, async () => {
		const res = await computePosition(anchor, floating, {
			strategy: 'fixed',
			placement,
			middleware: [
				offset(gap),
				flip({ padding: 8 }),
				shift({ padding: 8 }),
				size({
					padding: 8,
					apply({ availableHeight, rects }) {
						if (limitHeight) floating.style.maxHeight = `${Math.max(160, Math.min(availableHeight, maxHeight))}px`;
						if (matchWidth) floating.style.minWidth = `${rects.reference.width}px`;
					}
				}),
				...(arrowEl ? [arrow({ element: arrowEl, padding: 6 })] : [])
			]
		});
		Object.assign(floating.style, { left: `${res.x}px`, top: `${res.y}px` });
		floating.dataset.side = res.placement.split('-')[0];
		if (arrowEl && res.middlewareData.arrow) {
			const { x, y } = res.middlewareData.arrow;
			const side = res.placement.split('-')[0];
			const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side]!;
			Object.assign(arrowEl.style, { left: x != null ? `${x}px` : '', top: y != null ? `${y}px` : '', [opposite]: '-4px' });
		}
	});
}

/** Layar HP → dropdown tampil sebagai bottom sheet */
export const isMobile = () => matchMedia('(max-width: 639px)').matches;

let seq = 0;
export const uidEl = (p: string) => `${p}-${++seq}`;
