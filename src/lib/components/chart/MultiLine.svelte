<script lang="ts" module>
	export interface LineSeries {
		key: string;
		label: string;
		color: string;
		values: number[];
	}
</script>

<script lang="ts">
	/**
	 * Beberapa garis pada satu sumbu Y (mis. penjualan harian per toko). Crosshair mengunci ke titik X terdekat,
	 * tooltip memuat semua seri di X itu (urut nilai) + totalnya; panah kiri/kanan untuk keyboard.
	 * Legenda di luar komponen (pemanggil yang mengatur seri mana yang tampil).
	 */
	import { compact } from '#lib/util/format.ts';

	let {
		series,
		labels,
		titles,
		fmt,
		height = 280,
		ariaLabel
	}: {
		series: LineSeries[];
		/** label sumbu X per titik */
		labels: string[];
		/** label panjang di tooltip per titik */
		titles: string[];
		fmt: (v: number) => string;
		height?: number;
		ariaLabel: string;
	} = $props();

	let w = $state(640);
	let hover = $state<number | null>(null);
	const n = $derived(labels.length);
	const pad = { l: 46, r: 14, t: 14, b: 28 };
	const iw = $derived(Math.max(10, w - pad.l - pad.r));
	const ih = $derived(height - pad.t - pad.b);
	const max = $derived(Math.max(1, ...series.flatMap((s) => s.values)));
	const top = $derived.by(() => {
		const raw = max / 4;
		const p = Math.pow(10, Math.floor(Math.log10(raw)));
		return ([1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? p * 10) * 4;
	});
	const ticks = $derived([0, 1, 2, 3, 4].map((i) => (top / 4) * i));
	const x = (i: number) => pad.l + (n < 2 ? iw / 2 : (i / (n - 1)) * iw);
	const y = (v: number) => pad.t + ih - (Math.max(0, v) / top) * ih;
	const labelEvery = $derived(Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 44)))));

	/** kurva monotone: halus tapi tidak melampaui titik data */
	function smooth(vals: number[]) {
		const p = vals.map((v, i) => [x(i), y(v)] as const);
		if (p.length < 2) return p.length ? `M${p[0][0]},${p[0][1]}` : '';
		const k = p.length;
		const d = p.slice(1).map((q, i) => (q[1] - p[i][1]) / (q[0] - p[i][0] || 1));
		const m = p.map((_, i) => (i === 0 ? d[0] : i === k - 1 ? d[k - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
		let s = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
		for (let i = 0; i < k - 1; i++) {
			const h = (p[i + 1][0] - p[i][0]) / 3;
			s += `C${(p[i][0] + h).toFixed(1)},${(p[i][1] + m[i] * h).toFixed(1)} ${(p[i + 1][0] - h).toFixed(1)},${(p[i + 1][1] - m[i + 1] * h).toFixed(1)} ${p[i + 1][0].toFixed(1)},${p[i + 1][1].toFixed(1)}`;
		}
		return s;
	}
	const paths = $derived(series.map((s) => ({ s, d: smooth(s.values) })));

	function pick(e: PointerEvent) {
		const r = (e.currentTarget as SVGElement).getBoundingClientRect();
		const rel = (e.clientX - r.left - pad.l) / iw;
		hover = Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1))));
	}
	function onkey(e: KeyboardEvent) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		const i = hover ?? n - 1;
		hover = Math.min(n - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)));
	}
	const readout = $derived(hover === null ? [] : series.map((s) => ({ s, v: s.values[hover!] ?? 0 })).sort((a, b) => b.v - a.v));
	const tipLeft = $derived(hover === null ? 0 : x(hover) > w / 2 ? x(hover) - 12 : x(hover) + 12);
</script>

<div class="relative w-full min-w-0" bind:clientWidth={w}>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<svg
		class="block touch-pan-y outline-none"
		width={w}
		{height}
		role="img"
		aria-label="{ariaLabel}. Gunakan panah kiri/kanan untuk membaca nilai."
		tabindex="0"
		onpointermove={pick}
		onpointerdown={pick}
		onpointerleave={() => (hover = null)}
		onkeydown={onkey}
		onblur={() => (hover = null)}
	>
		{#each ticks as t (t)}
			<line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" />
			<text x={pad.l - 10} y={y(t)} dy="0.32em" text-anchor="end" class="fill-stone-400 text-[10px] tabular-nums">{compact(t)}</text>
		{/each}
		{#each labels as l, i (i)}
			{#if (i % labelEvery === 0 && n - 1 - i >= labelEvery / 2) || i === n - 1}
				<text x={x(i)} y={height - 8} text-anchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} class="fill-stone-400 text-[10px]">{l}</text>
			{/if}
		{/each}

		{#if hover !== null}
			<line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} class="stroke-stone-300 dark:stroke-stone-600" />
		{/if}
		{#each paths as { s, d } (s.key)}
			<path {d} fill="none" stroke={s.color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
		{/each}
		{#if hover !== null}
			{#each series as s (s.key)}
				<circle cx={x(hover)} cy={y(s.values[hover] ?? 0)} r="4" fill={s.color} stroke="var(--viz-surface)" stroke-width="2" />
			{/each}
		{/if}
	</svg>

	{#if hover !== null && readout.length}
		<div
			class="pointer-events-none absolute top-1 z-10 w-56 rounded-xl border border-stone-200 bg-white/95 px-3 py-2.5 text-xs text-stone-900 shadow-lg backdrop-blur dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-100 {x(hover) > w / 2 ? '-translate-x-full' : ''}"
			style="left:{tipLeft}px"
		>
			<p class="mb-1.5 text-stone-500">{titles[hover]}</p>
			<ul class="space-y-1">
				{#each readout.slice(0, 8) as { s, v } (s.key)}
					<li class="flex items-center gap-2">
						<span class="h-0.5 w-3 shrink-0 rounded-full" style="background:{s.color}"></span>
						<span class="min-w-0 flex-1 truncate text-stone-500">{s.label}</span>
						<span class="font-semibold tabular-nums">{fmt(v)}</span>
					</li>
				{/each}
			</ul>
			{#if series.length > 1}
				<p class="mt-1.5 flex justify-between border-t border-stone-100 pt-1.5 dark:border-stone-800">
					<span class="text-stone-500">Total</span>
					<span class="font-semibold tabular-nums">{fmt(readout.reduce((a, r) => a + r.v, 0))}</span>
				</p>
			{/if}
		</div>
	{/if}
</div>
