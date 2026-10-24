<script lang="ts">
	/**
	 * Panel melayang generik: Popover API (top layer) + Floating UI, bottom sheet di HP.
	 * Bisa dipicu tombol (`trigger`) atau dibuka manual dari elemen mana pun: `pop.show(el)`.
	 */
	import type { Placement } from '@floating-ui/dom';
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import { backClose } from '#lib/dom/backClose.svelte.ts';
	import { float, isMobile, uidEl } from '#lib/dom/floating.ts';

	let {
		trigger,
		children,
		placement = 'bottom-end',
		class: cls = 'w-72',
		label,
		open = $bindable(false),
		maxHeight,
		onclose
	}: {
		/** batasi tinggi ke ruang layar yang tersedia (px maks.); isi panel perlu bisa menyusut */
		maxHeight?: number;
		/** render tombol pemicu; sebarkan `props` ke elemen <button> */
		trigger?: Snippet<[Record<string, any>]>;
		children: Snippet;
		placement?: Placement;
		class?: string;
		/** judul aksesibel + judul bottom sheet */
		label?: string;
		open?: boolean;
		onclose?: () => void;
	} = $props();

	const popId = uidEl('pop');
	const btnId = popId + '-btn';
	let pop = $state<HTMLDivElement>();
	let sheet = $state(false);
	let anchor: Element | null = null;
	let lastAnchor: Element | null = null;
	let closedAt = 0;
	let stop: (() => void) | null = null;

	const triggerProps = $derived({ id: btnId, popovertarget: popId, 'aria-haspopup': 'dialog', 'aria-expanded': open, 'aria-controls': popId });

	/** buka di bawah `el` (default: tombol pemicu). Klik ulang pada pemicu yang sama = tutup. */
	export function show(el?: Element) {
		if (el && el === lastAnchor && performance.now() - closedAt < 250) return;
		if (pop?.matches(':popover-open')) pop.hidePopover();
		anchor = el ?? null;
		pop?.showPopover();
	}
	export function hide() {
		pop?.hidePopover();
	}
	backClose(() => open, hide);

	function onbeforetoggle(e: ToggleEvent) {
		if (e.newState === 'open') {
			open = true;
			sheet = isMobile();
			const a = anchor ?? document.getElementById(btnId);
			if (sheet || !a) pop!.style.cssText = '';
			else stop = float(a, pop!, { placement, gap: 8, limitHeight: !!maxHeight, maxHeight });
		} else {
			stop?.();
			stop = null;
		}
	}
	async function ontoggle(e: ToggleEvent) {
		if (e.newState === 'open') {
			await tick();
			pop?.querySelector<HTMLElement>('[autofocus], input, button, [tabindex="0"]')?.focus({ preventScroll: true });
		} else {
			const back = (anchor ?? document.getElementById(btnId)) as HTMLElement | null;
			if (pop?.contains(document.activeElement) || document.activeElement === document.body) back?.focus({ preventScroll: true });
			lastAnchor = anchor ?? document.getElementById(btnId);
			closedAt = performance.now();
			anchor = null;
			open = false;
			onclose?.();
		}
	}
</script>

{#if trigger}{@render trigger(triggerProps)}{/if}

<div
	bind:this={pop}
	id={popId}
	popover="auto"
	role="dialog"
	aria-label={label}
	{onbeforetoggle}
	{ontoggle}
	class="pop z-[90] border border-stone-200/80 bg-white text-stone-900 shadow-2xl shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 {sheet
		? 'pop-sheet pb-safe flex flex-col rounded-t-3xl'
		: `rounded-xl ${cls}`}"
>
	{#if sheet}
		<div class="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-stone-200 dark:bg-stone-700"></div>
	{/if}
	{#if open}{@render children()}{/if}
</div>
