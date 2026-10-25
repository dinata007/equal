<script lang="ts">
	/**
	 * Batang horizontal bertumpuk per baris (mis. stok per dept, dipecah per brand) dengan sela 2px antar segmen.
	 * Panjang batang = jumlah bagian positif, angka di kanan = total bersih (bagian minus disebut terpisah).
	 * Baris bisa diklik (filter silang); tooltip per segmen.
	 */
	import { tooltip } from '#lib/dom/tooltip.ts';

	interface Part {
		key: string;
		label: string;
		color: string;
	}
	let {
		rows,
		parts,
		fmt,
		selected = '',
		onselect
	}: {
		rows: { key: string; label: string; values: Record<string, number> }[];
		parts: Part[];
		fmt: (v: number) => string;
		selected?: string;
		onselect?: (key: string) => void;
	} = $props();

	const pos = (r: (typeof rows)[number]) => parts.reduce((s, p) => s + Math.max(0, r.values[p.key] ?? 0), 0);
	const max = $derived(Math.max(1, ...rows.map(pos)));
</script>

<div class="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
	{#each parts as p (p.key)}
		<span class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-[3px]" style="background:{p.color}"></span>{p.label}</span>
	{/each}
</div>
<ul class="space-y-0.5">
	{#each rows as r (r.key)}
		{@const net = parts.reduce((s, p) => s + (r.values[p.key] ?? 0), 0)}
		{@const neg = parts.reduce((s, p) => s + Math.min(0, r.values[p.key] ?? 0), 0)}
		<li>
			<button
				type="button"
				class="grid w-full grid-cols-[minmax(0,8.5rem)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-stone-50 sm:grid-cols-[minmax(0,11rem)_1fr_auto] dark:hover:bg-stone-800/50 {selected === r.key ? 'bg-stone-100 dark:bg-stone-800' : ''} {selected && selected !== r.key ? 'opacity-50' : ''}"
				aria-pressed={selected === r.key}
				disabled={!onselect}
				onclick={() => onselect?.(r.key)}
			>
				<span class="truncate">{r.label}</span>
				<span class="flex h-3 gap-[2px]" style="width:{(pos(r) / max) * 100}%">
					{#each parts as p (p.key)}
						{@const v = r.values[p.key] ?? 0}
						{#if v > 0}
							<span class="h-3 min-w-[3px] first:rounded-l-[4px] last:rounded-r-[4px]" style="flex:{v} 1 0;background:{p.color}" {@attach tooltip(`${r.label} · ${p.label}: ${fmt(v)}`)}></span>
						{/if}
					{/each}
				</span>
				<span class="text-right tabular-nums">
					<span class="font-medium">{fmt(net)}</span>
					{#if neg < 0}<span class="block text-[11px] text-rose-600 dark:text-rose-400">minus {fmt(-neg)}</span>{/if}
				</span>
			</button>
		</li>
	{:else}
		<li class="py-8 text-center text-sm text-stone-400">Belum ada data</li>
	{/each}
</ul>
