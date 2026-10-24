<script lang="ts">
	/** Peta panas baris × kolom dengan skala sekuensial satu hue (7 tingkat) + legenda skala. */
	import { tooltip } from '#lib/dom/tooltip.ts';

	let {
		rows,
		cols,
		values,
		fmt,
		cellFmt
	}: { rows: string[]; cols: string[]; values: number[][]; fmt: (v: number) => string; cellFmt: (v: number) => string } = $props();

	const max = $derived(Math.max(0, ...values.flat()));
	const step = (v: number) => (max ? Math.min(6, Math.floor((v / max) * 6.999)) : 0);
	// teks di dalam sel: tinta gelap di tingkat muda, putih di tingkat pekat (ikut tema)
	const ink = (s: number) =>
		s >= 5 ? 'text-white dark:text-stone-950' : s === 4 ? 'text-white' : s === 3 ? 'text-stone-900 dark:text-white' : 'text-stone-700 dark:text-stone-300';
</script>

<div class="overflow-x-auto">
	<table class="w-full min-w-[19rem] border-separate border-spacing-[3px] text-xs">
		<thead>
			<tr>
				<th class="w-16 sm:w-24"></th>
				{#each cols as c (c)}<th class="pb-1 text-center font-medium text-stone-400">{c}</th>{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as r, i (r)}
				<tr>
					<th class="max-w-16 truncate pr-1 sm:max-w-24 sm:pr-2 text-left font-normal text-stone-500" title={r}>{r}</th>
					{#each cols as c, j (c)}
						{@const v = values[i]?.[j] ?? 0}
						{@const s = step(v)}
						<td
							class="h-9 rounded-md text-center text-[10px] font-medium tabular-nums transition hover:ring-2 hover:ring-stone-900/20 dark:hover:ring-white/30 {ink(s)}"
							style="background:var(--seq-{s})"
							tabindex="0"
							{@attach tooltip(`${r} · ${c}: ${fmt(v)}`)}
						>
							{v ? cellFmt(v) : ''}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<div class="mt-3 flex items-center justify-end gap-2 text-[11px] text-stone-400">
	<span>Rendah</span>
	<span class="flex gap-[2px]">
		{#each [0, 1, 2, 3, 4, 5, 6] as s (s)}<span class="h-2.5 w-4 first:rounded-l last:rounded-r" style="background:var(--seq-{s})"></span>{/each}
	</span>
	<span>Tinggi</span>
</div>
