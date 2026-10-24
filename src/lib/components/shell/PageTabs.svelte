<script lang="ts">
	/** Deret tab halaman yang sudah dibuka (desktop) — lihat state/tabs.svelte.ts. Urutan bisa di-drag. */
	import { page } from '$app/state';
	import { Ellipsis, X } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { tabInfo, tabs } from '#lib/state/tabs.svelte.ts';
	import { scrollTabs } from '#lib/dom/scrollTabs.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';
	import Menu from '../ui/Menu.svelte';

	// setiap halaman yang dibuka (sidebar, Ctrl K, link) otomatis jadi tab
	$effect(() => {
		const url = page.url;
		void url.search;
		untrack(() => tabs.visit(url));
	});

	const shown = $derived(tabs.list.flatMap((t) => (tabInfo(t.path) ? [{ ...t, info: tabInfo(t.path)! }] : [])));

	/** klik tengah = tutup (seperti tab browser) */
	function onauxclick(e: MouseEvent, path: string) {
		if (e.button !== 1) return;
		e.preventDefault();
		tabs.close(path);
	}

	/* ---------- drag untuk mengubah urutan ---------- */
	let row = $state<HTMLDivElement>();
	let dragPath = $state<string | null>(null);
	let drag: { path: string; el: HTMLElement; startX: number; startLeft: number; startScroll: number; x: number; order: string[]; raf: number } | null = null;
	/** klik yang menyusul setelah drag dilepas tidak boleh membuka tab */
	let swallowClick = false;
	const THRESHOLD = 6;
	const EDGE = 48;

	function onpointerdown(e: PointerEvent, path: string) {
		if (e.button !== 0 || e.pointerType === 'touch' || (e.target as Element).closest('button')) return;
		const el = e.currentTarget as HTMLElement;
		drag = { path, el, startX: e.clientX, startLeft: el.offsetLeft, startScroll: row!.scrollLeft, x: e.clientX, order: tabs.list.map((t) => t.path), raf: 0 };
	}

	function onpointermove(e: PointerEvent) {
		if (!drag) return;
		drag.x = e.clientX;
		if (!dragPath) {
			if (Math.abs(e.clientX - drag.startX) < THRESHOLD) return;
			dragPath = drag.path;
			drag.el.setPointerCapture(e.pointerId);
			frame();
		}
	}

	/** tiap frame: gulir otomatis di tepi, posisikan tab di bawah kursor, tukar urutan bila melewati tengah tab lain */
	function frame() {
		if (!drag || !row) return;
		const r = row.getBoundingClientRect();
		if (drag.x < r.left + EDGE) row.scrollLeft -= Math.ceil((r.left + EDGE - drag.x) / 4);
		else if (drag.x > r.right - EDGE) row.scrollLeft += Math.ceil((drag.x - (r.right - EDGE)) / 4);

		const width = drag.el.offsetWidth;
		const max = row.scrollWidth - width;
		const left = Math.max(0, Math.min(max, drag.startLeft + (drag.x + row.scrollLeft) - (drag.startX + drag.startScroll)));
		// posisi baru mengikuti KURSOR (seperti tab browser), bukan tengah tab — lebar tab bisa sangat berbeda
		const px = drag.x - r.left + row.scrollLeft;
		let to = 0;
		for (const el of row.querySelectorAll<HTMLElement>('[data-tab]')) {
			if (el === drag.el) continue;
			if (el.offsetLeft + el.offsetWidth / 2 < px) to++;
		}
		tabs.move(drag.path, to);
		// posisi tata letak sesudah urutan berubah (offsetLeft tidak terpengaruh transform)
		drag.el.style.transform = `translateX(${left - drag.el.offsetLeft}px)`;
		drag.raf = requestAnimationFrame(frame);
	}

	function end(cancel = false) {
		if (!drag) return;
		cancelAnimationFrame(drag.raf);
		const { el, order } = drag;
		const moved = !!dragPath;
		drag = null;
		dragPath = null;
		if (!moved) return;
		swallowClick = true;
		setTimeout(() => (swallowClick = false));
		if (cancel) for (const [i, p] of order.entries()) tabs.move(p, i);
		else tabs.saveOrder();
		// kembali mulus ke tempatnya
		el.style.transition = 'transform 160ms cubic-bezier(.2,.9,.3,1)';
		el.style.transform = '';
		el.addEventListener('transitionend', () => (el.style.transition = ''), { once: true });
	}

	function onclickcapture(e: MouseEvent) {
		if (!swallowClick) return;
		e.preventDefault();
		e.stopPropagation();
		swallowClick = false;
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && dragPath && end(true)} />

<nav class="flex min-w-0 items-center gap-1" aria-label="Tab halaman">
	<div bind:this={row} class="scroll-tabs relative -my-1 flex min-w-0 items-center gap-1 py-1 {dragPath ? 'cursor-grabbing select-none' : ''}" {@attach scrollTabs()}>
		{#each shown as t (t.path)}
			{@const active = page.url.pathname === t.path}
			{@const dragging = dragPath === t.path}
			<!-- pembungkus untuk drag (yang bisa difokus & diklik: link & tombol tutup di dalamnya) -->
			<div
				role="presentation"
				data-tab={t.path}
				animate:flip={{ duration: dragging ? 0 : 180 }}
				onpointerdown={(e) => onpointerdown(e, t.path)}
				{onpointermove}
				onpointerup={() => end()}
				onpointercancel={() => end()}
				{onclickcapture}
				class="group relative flex shrink-0 items-center rounded-lg transition-colors {dragging
					? 'z-10 bg-white shadow-lg ring-1 shadow-stone-900/10 ring-stone-200 dark:bg-stone-800 dark:ring-stone-700'
					: active
						? 'bg-stone-100 dark:bg-stone-800'
						: 'hover:bg-stone-100/70 dark:hover:bg-stone-800/60'}"
			>
				<a
					href={t.href}
					draggable="false"
					aria-current={active ? 'page' : undefined}
					onmousedown={(e) => e.button === 1 && e.preventDefault()}
					onauxclick={(e) => onauxclick(e, t.path)}
					class="flex h-9 max-w-56 items-center gap-2 pr-8 pl-3 text-sm whitespace-nowrap {dragPath ? 'cursor-grabbing' : ''} {active
						? 'font-medium text-stone-900 dark:text-stone-100'
						: 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'}"
					{@attach tooltip(t.info.trail, { placement: 'bottom' })}
				>
					{#if t.info.icon}<t.info.icon class="size-4 shrink-0 {active ? 'text-brand-600' : 'opacity-70'}" />{/if}
					<span class="truncate">{t.info.label}</span>
				</a>
				<button
					type="button"
					class="absolute right-1 grid size-6 place-items-center rounded-md text-stone-400 transition hover:bg-stone-200 hover:text-stone-700 focus-visible:opacity-100 dark:hover:bg-stone-700 dark:hover:text-stone-200 {active || dragging ? '' : 'opacity-0 group-hover:opacity-100'}"
					aria-label="Tutup tab {t.info.label}"
					onclick={() => tabs.close(t.path)}
				>
					<X class="size-3.5" />
				</button>
			</div>
		{/each}
	</div>
	{#if tabs.list.length}
		<Menu
			placement="bottom-start"
			items={[
				{ label: 'Tutup tab lain', onclick: () => tabs.closeOthers() },
				{ label: 'Tutup semua tab', onclick: () => tabs.closeAll(), danger: true }
			]}
		>
			{#snippet trigger(props)}
				<button {...props} class="btn btn-ghost btn-icon btn-sm shrink-0 aria-expanded:bg-stone-100 dark:aria-expanded:bg-stone-800" aria-label="Pilihan tab" {@attach tooltip(undefined, { placement: 'bottom' })}>
					<Ellipsis class="size-4" />
				</button>
			{/snippet}
		</Menu>
	{/if}
</nav>
