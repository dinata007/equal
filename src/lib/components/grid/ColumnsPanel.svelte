<script lang="ts">
	/** Atur kolom: tampil/sembunyi + geser urutan (seret, atau Alt+↑/↓ dari keyboard). */
	import { Check, GripVertical, RotateCcw } from '@lucide/svelte';

	let {
		columns,
		hidden,
		ontoggle,
		onmove,
		onreset
	}: {
		columns: { key: string; label: string; hideable: boolean }[];
		hidden: string[];
		ontoggle: (key: string) => void;
		onmove: (from: number, to: number) => void;
		onreset: () => void;
	} = $props();

	let dragFrom = $state<number | null>(null);
	let dropAt = $state<number | null>(null);
	let listEl = $state<HTMLUListElement>();

	function ondragover(e: DragEvent, i: number) {
		if (dragFrom === null) return;
		e.preventDefault();
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		dropAt = e.clientY < r.top + r.height / 2 ? i : i + 1;
	}
	function ondrop(e: DragEvent) {
		e.preventDefault();
		if (dragFrom !== null && dropAt !== null) {
			const to = dropAt > dragFrom ? dropAt - 1 : dropAt;
			if (to !== dragFrom) onmove(dragFrom, to);
		}
		dragFrom = dropAt = null;
	}
	function onkeydown(e: KeyboardEvent, i: number) {
		if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
		e.preventDefault();
		const to = i + (e.key === 'ArrowUp' ? -1 : 1);
		if (to < 0 || to >= columns.length) return;
		onmove(i, to);
		requestAnimationFrame(() => listEl?.querySelectorAll<HTMLElement>('[data-col-btn]')[to]?.focus());
	}
	const shownCount = $derived(columns.filter((c) => !hidden.includes(c.key)).length);
</script>

<div class="flex min-h-0 flex-col">
	<div class="flex items-center justify-between gap-2 px-4 pt-3 pb-1">
		<p class="text-xs font-semibold tracking-wide text-stone-500 uppercase">Kolom · {shownCount}/{columns.length}</p>
		<button type="button" class="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline" onclick={onreset}>
			<RotateCcw class="size-3" /> Reset
		</button>
	</div>
	<p class="px-4 pb-2 text-[11px] text-stone-400">Seret <GripVertical class="inline size-3" /> untuk mengubah urutan · Alt + ↑/↓</p>
	<ul bind:this={listEl} class="max-h-[min(60vh,420px)] min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-1.5" ondragleave={(e) => !listEl?.contains(e.relatedTarget as Node) && (dropAt = null)}>
		{#each columns as c, i (c.key)}
			{@const on = !hidden.includes(c.key)}
			<li
				class="relative {dragFrom === i ? 'opacity-40' : ''}"
				draggable="true"
				ondragstart={(e) => ((dragFrom = i), e.dataTransfer?.setData('text/plain', c.key), e.dataTransfer && (e.dataTransfer.effectAllowed = 'move'))}
				ondragend={() => (dragFrom = dropAt = null)}
				ondragover={(e) => ondragover(e, i)}
				{ondrop}
			>
				{#if dropAt === i}<span class="pointer-events-none absolute inset-x-2 -top-px h-0.5 rounded-full bg-brand-500"></span>{/if}
				{#if dropAt === i + 1 && i === columns.length - 1}<span class="pointer-events-none absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500"></span>{/if}
				<div class="flex items-center gap-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
					<span class="grid h-9 w-6 shrink-0 cursor-grab place-items-center text-stone-300 active:cursor-grabbing dark:text-stone-600" aria-hidden="true">
						<GripVertical class="size-4" />
					</span>
					<button
						type="button"
						data-col-btn
						role="switch"
						aria-checked={on}
						disabled={!c.hideable && on}
						class="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-2 pr-2.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed"
						onclick={() => ontoggle(c.key)}
						onkeydown={(e) => onkeydown(e, i)}
					>
						<span class="min-w-0 flex-1 truncate {on ? '' : 'text-stone-400'}">{c.label}</span>
						<span class="grid size-4 shrink-0 place-items-center rounded border transition {on ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 dark:border-stone-600'} {!c.hideable ? 'opacity-50' : ''}">
							{#if on}<Check class="size-3" strokeWidth={3} />{/if}
						</span>
					</button>
				</div>
			</li>
		{/each}
	</ul>
</div>
