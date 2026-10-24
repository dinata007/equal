<script lang="ts">
	/** Daftar peringkat dengan bar horizontal (magnitudo, satu hue). */
	import { money } from '#lib/util/format.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';

	let { items, unit = '' }: { items: { label: string; value: number; sub?: string }[]; unit?: string } = $props();
	const max = $derived(Math.max(1, ...items.map((i) => i.value)));
</script>

<ul class="space-y-3">
	{#each items as it, i (it.label + i)}
		<li {@attach tooltip(`${it.label}: ${money(it.value)}${unit}`)}>
			<div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
				<span class="truncate">{it.label}{#if it.sub}<span class="ml-1.5 text-xs text-stone-400">{it.sub}</span>{/if}</span>
				<span class="shrink-0 font-medium tabular-nums">{money(it.value)}{unit}</span>
			</div>
			<div class="h-2 rounded-full bg-stone-100 dark:bg-stone-800">
				<div class="h-2 rounded-full bg-brand-500" style="width:{(it.value / max) * 100}%"></div>
			</div>
		</li>
	{:else}
		<li class="py-6 text-center text-sm text-stone-400">Belum ada data</li>
	{/each}
</ul>
