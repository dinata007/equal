<script lang="ts">
	/** Bar bertumpuk 100% (part-to-whole) dengan sela 2px antar segmen + legenda berlabel %. */
	import { tooltip } from '#lib/dom/tooltip.ts';
	import type { Slice } from './Donut.svelte';

	let { items, fmt }: { items: Slice[]; fmt: (v: number) => string } = $props();
	const total = $derived(items.reduce((s, i) => s + i.value, 0));
	const shown = $derived(items.filter((i) => i.value > 0));
	const pct = (v: number) => (total ? (v / total) * 100 : 0);
	const pctText = (v: number) => pct(v).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%';
</script>

<div class="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-[var(--viz-grid)]" role="img" aria-label={items.map((i) => `${i.label} ${pctText(i.value)}`).join(', ')}>
	{#each shown as it (it.key)}
		<div class="h-full min-w-[3px] transition-[flex-grow] duration-300 first:rounded-l-full last:rounded-r-full hover:brightness-110" style="flex-grow:{it.value};flex-basis:0;background:{it.color}" {@attach tooltip(`${it.label}: ${fmt(it.value)} (${pctText(it.value)})`)}></div>
	{/each}
</div>
<ul class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
	{#each items as it (it.key)}
		<li class="flex min-w-0 items-center gap-2 text-sm">
			<span class="size-2.5 shrink-0 rounded-[3px]" style="background:{it.color}"></span>
			<span class="min-w-0 flex-1 truncate text-stone-600 dark:text-stone-300">{it.label}</span>
			<span class="font-medium tabular-nums">{pctText(it.value)}</span>
		</li>
	{/each}
</ul>
