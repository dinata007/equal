/**
 * Tooltip modern sebagai Svelte attachment:  <button {@attach tooltip()} aria-label="Cari">
 * - satu elemen bersama di top layer (Popover API), posisi flip/shift (Floating UI) + panah
 * - tampil saat hover mouse (jeda 350 ms, lalu "hangat" → instan) & saat fokus keyboard
 * - tidak muncul saat disentuh (HP), tutup dengan Esc / klik / scroll
 * Tanpa teks → memakai aria-label elemen.
 */
import type { Placement } from '@floating-ui/dom';
import type { Attachment } from 'svelte/attachments';
import { float } from './floating';

interface TipOpts {
	placement?: Placement;
	/** pintasan keyboard, mis. "Ctrl K" */
	kbd?: string;
}

let el: HTMLDivElement | null = null;
let textEl: HTMLSpanElement;
let kbdEl: HTMLElement;
let arrowEl: HTMLDivElement;
let stop: (() => void) | null = null;
let owner: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let warmUntil = 0;

function ensure() {
	if (el) return el;
	el = document.createElement('div');
	el.id = 'app-tooltip';
	el.setAttribute('popover', 'manual');
	el.setAttribute('role', 'tooltip');
	el.className =
		'pop pointer-events-none z-[100] flex max-w-64 items-center gap-2 rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs leading-snug font-medium text-white shadow-lg dark:bg-stone-100 dark:text-stone-900';
	textEl = document.createElement('span');
	kbdEl = document.createElement('kbd');
	kbdEl.className = 'rounded border border-white/20 px-1 font-sans text-[10px] text-white/70 dark:border-stone-900/20 dark:text-stone-500';
	arrowEl = document.createElement('div');
	arrowEl.className = 'absolute size-2 rotate-45 bg-stone-900 dark:bg-stone-100';
	el.append(textEl, kbdEl, arrowEl);
	document.body.append(el);
	// satu listener global: tooltip ditutup saat halaman di-scroll
	addEventListener('scroll', hide, { capture: true, passive: true });
	return el;
}

function hide() {
	clearTimeout(timer);
	if (!owner || !el) return;
	owner.removeAttribute('aria-describedby');
	owner = null;
	stop?.();
	stop = null;
	if (el.matches(':popover-open')) el.hidePopover();
	warmUntil = Date.now() + 500;
}

function show(node: HTMLElement, text: string, opts: TipOpts) {
	if (!text || !node.isConnected) return;
	const tip = ensure();
	if (owner && owner !== node) hide();
	owner = node;
	textEl.textContent = text;
	kbdEl.textContent = opts.kbd ?? '';
	kbdEl.hidden = !opts.kbd;
	node.setAttribute('aria-describedby', tip.id);
	if (!tip.matches(':popover-open')) tip.showPopover();
	stop?.();
	stop = float(node, tip, { placement: opts.placement ?? 'top', gap: 8, arrowEl });
}

export function tooltip(text?: string, opts: TipOpts = {}): Attachment<HTMLElement> {
	return (node) => {
		const label = () => text ?? node.getAttribute('aria-label') ?? '';
		const enter = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') return;
			clearTimeout(timer);
			timer = setTimeout(() => show(node, label(), opts), Date.now() < warmUntil ? 0 : 350);
		};
		const focus = () => node.matches(':focus-visible') && show(node, label(), opts);
		const key = (e: KeyboardEvent) => e.key === 'Escape' && hide();
		node.addEventListener('pointerenter', enter);
		node.addEventListener('pointerleave', hide);
		node.addEventListener('pointerdown', hide);
		node.addEventListener('focus', focus);
		node.addEventListener('blur', hide);
		node.addEventListener('keydown', key);
		return () => {
			node.removeEventListener('pointerenter', enter);
			node.removeEventListener('pointerleave', hide);
			node.removeEventListener('pointerdown', hide);
			node.removeEventListener('focus', focus);
			node.removeEventListener('blur', hide);
			node.removeEventListener('keydown', key);
			if (owner === node) hide();
		};
	};
}
