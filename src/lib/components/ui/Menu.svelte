<script lang="ts" module>
	import type { Component } from 'svelte';
	export interface MenuItem {
		label: string;
		icon?: Component<any>;
		href?: string;
		onclick?: () => void;
		danger?: boolean;
		kbd?: string;
		/** judul kelompok; tampil saat berganti dari item sebelumnya */
		section?: string;
	}
</script>

<script lang="ts">
	/** Dropdown menu aksi: Popover API + Floating UI, navigasi panah/Home/End, ARIA menu. */
	import type { Placement } from '@floating-ui/dom';
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import { backClose } from '#lib/dom/backClose.svelte.ts';
	import { float, uidEl } from '#lib/dom/floating.ts';

	let {
		items,
		trigger,
		header,
		placement = 'bottom-end'
	}: {
		items: MenuItem[];
		/** render tombol pemicu; sebarkan `props` ke elemen <button> */
		trigger: Snippet<[Record<string, any>]>;
		header?: Snippet;
		placement?: Placement;
	} = $props();

	const popId = uidEl('menu');
	const btnId = popId + '-btn';
	let pop = $state<HTMLDivElement>();
	let open = $state(false);
	let stop: (() => void) | null = null;
	backClose(() => open, () => pop?.hidePopover());

	const triggerProps = $derived({ id: btnId, popovertarget: popId, 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': popId });
	const itemsEls = () => [...(pop?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

	function onbeforetoggle(e: ToggleEvent) {
		if (e.newState === 'open') stop = float(document.getElementById(btnId)!, pop!, { placement, gap: 8, maxHeight: 440 });
		else (stop?.(), (stop = null));
	}
	async function ontoggle(e: ToggleEvent) {
		open = e.newState === 'open';
		if (open) {
			await tick();
			itemsEls()[0]?.focus();
		}
	}
	function onkeydown(e: KeyboardEvent) {
		const els = itemsEls();
		const i = els.indexOf(document.activeElement as HTMLElement);
		const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: els.length - 1 }[e.key];
		if (to === undefined) return;
		e.preventDefault();
		els[(to + els.length) % els.length]?.focus();
	}
	function run(it: MenuItem) {
		pop?.hidePopover();
		it.onclick?.();
	}
</script>

{@render trigger(triggerProps)}

<div
	bind:this={pop}
	id={popId}
	popover="auto"
	role="menu"
	aria-labelledby={btnId}
	tabindex="-1"
	{onbeforetoggle}
	{ontoggle}
	{onkeydown}
	class="pop z-[90] w-64 overflow-y-auto! overscroll-contain rounded-xl border border-stone-200/80 bg-white p-1.5 shadow-2xl shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900"
>
	{#if header}
		{@render header()}
		<div class="my-1 h-px bg-stone-100 dark:bg-stone-800"></div>
	{/if}
	<!-- urutan ikut kunci: label boleh kembar (mis. dua kolom tabel berjudul sama) -->
	{#each items as it, i (`${i}:${it.label}${it.href ?? ''}`)}
		{#if it.section && it.section !== items[i - 1]?.section}
			<p class="px-3 pt-2.5 pb-1 text-[10px] font-semibold tracking-wider text-stone-400 uppercase {i ? 'mt-1 border-t border-stone-100 dark:border-stone-800' : ''}">{it.section}</p>
		{/if}
		{@const cls = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors focus:bg-stone-100 hover:bg-stone-100 dark:focus:bg-stone-800 dark:hover:bg-stone-800 ${it.danger ? 'text-rose-600 focus:bg-rose-50 hover:bg-rose-50 dark:text-rose-400 dark:focus:bg-rose-500/10 dark:hover:bg-rose-500/10' : ''}`}
		{#if it.href}
			<a role="menuitem" tabindex="-1" href={it.href} class={cls} onclick={() => pop?.hidePopover()}>
				{#if it.icon}<it.icon class="size-4 shrink-0 opacity-70" />{/if}
				<span class="flex-1">{it.label}</span>
				{#if it.kbd}<kbd class="text-[10px] text-stone-400">{it.kbd}</kbd>{/if}
			</a>
		{:else}
			<button role="menuitem" tabindex="-1" type="button" class={cls} onclick={() => run(it)}>
				{#if it.icon}<it.icon class="size-4 shrink-0 opacity-70" />{/if}
				<span class="flex-1">{it.label}</span>
				{#if it.kbd}<kbd class="text-[10px] text-stone-400">{it.kbd}</kbd>{/if}
			</button>
		{/if}
	{/each}
</div>
