<script lang="ts">
	/** Bar chart satu seri (magnitudo per waktu) dengan tooltip hover. */
	import { compact, date as fdate, rp } from '#lib/util/format.ts';

	let { data, height = 220, label = 'Omzet' }: { data: { key: string; value: number }[]; height?: number; label?: string } = $props();

	let w = $state(600);
	let hover = $state<number | null>(null);
	const pad = { l: 44, r: 8, t: 12, b: 24 };
	const max = $derived(Math.max(1, ...data.map((d) => d.value)));
	const nice = $derived.by(() => {
		const p = Math.pow(10, Math.floor(Math.log10(max)));
		const n = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s * 4 >= max) ?? p * 10;
		return n * 4;
	});
	const ticks = $derived([0, 0.25, 0.5, 0.75, 1].map((f) => f * nice));
	const iw = $derived(Math.max(10, w - pad.l - pad.r));
	const ih = $derived(height - pad.t - pad.b);
	const step = $derived(iw / Math.max(1, data.length));
	const bw = $derived(Math.max(2, Math.min(28, step - 2)));
	const y = (v: number) => pad.t + ih - (v / nice) * ih;
	const labelEvery = $derived(Math.ceil(data.length / Math.max(1, Math.floor(iw / 56))));
</script>

<div class="relative w-full min-w-0 overflow-hidden" bind:clientWidth={w}>
	<svg class="block" width={w} {height} role="img" aria-label="{label} per hari">
		{#each ticks as t (t)}
			<line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} class="stroke-stone-100 dark:stroke-stone-800" />
			<text x={pad.l - 8} y={y(t)} dy="0.32em" text-anchor="end" class="fill-stone-400 text-[10px]">{compact(t)}</text>
		{/each}
		{#each data as d, i (d.key)}
			{@const x = pad.l + i * step + (step - bw) / 2}
			{@const h = Math.max(0, pad.t + ih - y(d.value))}
			<!-- area hit lebih besar dari mark -->
			<rect x={pad.l + i * step} y={pad.t} width={step} height={ih} fill="transparent" role="presentation" onmouseenter={() => (hover = i)} onmouseleave={() => (hover = null)} />
			<path
				d="M{x},{pad.t + ih} v{-Math.max(0, h - Math.min(4, h))} q0,{-Math.min(4, h)} {Math.min(4, bw / 2)},{-Math.min(4, h)} h{bw - 2 * Math.min(4, bw / 2)} q{Math.min(4, bw / 2)},0 {Math.min(4, bw / 2)},{Math.min(4, h)} v{Math.max(0, h - Math.min(4, h))} z"
				class="pointer-events-none transition-opacity {hover === null || hover === i ? 'fill-brand-500' : 'fill-brand-500/35'}"
			/>
			{#if i % labelEvery === 0}
				<text x={x + bw / 2} y={height - 6} text-anchor="middle" class="fill-stone-400 text-[10px]">{d.key.slice(8)}/{d.key.slice(5, 7)}</text>
			{/if}
		{/each}
		<line x1={pad.l} x2={w - pad.r} y1={pad.t + ih} y2={pad.t + ih} class="stroke-stone-300 dark:stroke-stone-700" />
	</svg>
	{#if hover !== null && data[hover]}
		{@const d = data[hover]}
		{@const left = Math.min(Math.max(pad.l + hover * step + step / 2, 70), w - 70)}
		<div class="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-stone-700 dark:bg-stone-900" style="left:{left}px">
			<p class="text-stone-500">{fdate(d.key)}</p>
			<p class="font-semibold tabular-nums">{rp(d.value)}</p>
		</div>
	{/if}
</div>
