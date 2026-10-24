<script lang="ts" module>
	export interface TrendPoint {
		label: string;
		/** label panjang di tooltip */
		title: string;
		cur: number;
		prev: number | null;
	}
</script>

<script lang="ts">
	/**
	 * Tren satu ukuran: periode ini (area + garis, warna aksen) vs periode sebelumnya (garis abu).
	 * Satu sumbu Y; crosshair mengunci ke titik terdekat; panah kiri/kanan untuk keyboard.
	 */
	import { compact } from '#lib/util/format.ts';
	import Delta from './Delta.svelte';


	let {
		points,
		fmt,
		curLabel = 'Periode ini',
		prevLabel = 'Periode sebelumnya',
		height = 260,
		ariaLabel
	}: { points: TrendPoint[]; fmt: (v: number) => string; curLabel?: string; prevLabel?: string; height?: number; ariaLabel: string } = $props();

	const gid = $props.id();
	let w = $state(640);
	let hover = $state<number | null>(null);
	const pad = { l: 46, r: 14, t: 14, b: 28 };
	const iw = $derived(Math.max(10, w - pad.l - pad.r));
	const ih = $derived(height - pad.t - pad.b);
	const hasPrev = $derived(points.some((p) => p.prev != null && p.prev > 0));
	const max = $derived(Math.max(1, ...points.map((p) => Math.max(p.cur, hasPrev ? (p.prev ?? 0) : 0))));
	const top = $derived.by(() => {
		const raw = max / 4;
		const p = Math.pow(10, Math.floor(Math.log10(raw)));
		return ([1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? p * 10) * 4;
	});
	const ticks = $derived([0, 1, 2, 3, 4].map((i) => (top / 4) * i));
	const x = (i: number) => pad.l + (points.length < 2 ? iw / 2 : (i / (points.length - 1)) * iw);
	const y = (v: number) => pad.t + ih - (v / top) * ih;

	/** kurva halus monotone (tidak melampaui titik data) */
	function smooth(vals: number[]) {
		const p = vals.map((v, i) => [x(i), y(v)] as const);
		if (p.length < 2) return p.length ? `M${p[0][0]},${p[0][1]}` : '';
		const n = p.length;
		const d = p.slice(1).map((q, i) => (q[1] - p[i][1]) / (q[0] - p[i][0] || 1));
		const m = p.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
		let s = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
		for (let i = 0; i < n - 1; i++) {
			const h = (p[i + 1][0] - p[i][0]) / 3;
			s += `C${(p[i][0] + h).toFixed(1)},${(p[i][1] + m[i] * h).toFixed(1)} ${(p[i + 1][0] - h).toFixed(1)},${(p[i + 1][1] - m[i + 1] * h).toFixed(1)} ${p[i + 1][0].toFixed(1)},${p[i + 1][1].toFixed(1)}`;
		}
		return s;
	}
	const curPath = $derived(smooth(points.map((p) => p.cur)));
	const prevPath = $derived(hasPrev ? smooth(points.map((p) => p.prev ?? 0)) : '');
	const labelEvery = $derived(Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(iw / 64)))));

	function pick(e: PointerEvent) {
		const r = (e.currentTarget as SVGElement).getBoundingClientRect();
		const rel = (e.clientX - r.left - pad.l) / iw;
		hover = Math.min(points.length - 1, Math.max(0, Math.round(rel * (points.length - 1))));
	}
	function onkey(e: KeyboardEvent) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		const i = hover ?? points.length - 1;
		hover = Math.min(points.length - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)));
	}
	const active = $derived(hover ?? points.length - 1);
	const tipLeft = $derived(Math.min(Math.max(x(active), 96), w - 96));
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
		<defs>
			<linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
				<stop offset="0" stop-color="var(--viz-1)" stop-opacity="0.18" />
				<stop offset="1" stop-color="var(--viz-1)" stop-opacity="0.02" />
			</linearGradient>
		</defs>
		{#each ticks as t (t)}
			<line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" />
			<text x={pad.l - 10} y={y(t)} dy="0.32em" text-anchor="end" class="fill-stone-400 text-[10px] tabular-nums">{compact(t)}</text>
		{/each}
		{#each points as p, i (i)}
			{#if i % labelEvery === 0 || i === points.length - 1}
				{#if i === points.length - 1 || points.length - 1 - i >= labelEvery / 2}
					<text x={x(i)} y={height - 8} text-anchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} class="fill-stone-400 text-[10px]">{p.label}</text>
				{/if}
			{/if}
		{/each}

		{#if prevPath}
			<path d={prevPath} fill="none" stroke="var(--viz-muted)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
		{/if}
		{#if curPath}
			<path d="{curPath}L{x(points.length - 1)},{pad.t + ih}L{x(0)},{pad.t + ih}Z" fill="url(#{gid})" />
			<path d={curPath} fill="none" stroke="var(--viz-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
		{/if}

		{#if hover !== null}
			<line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} class="stroke-stone-300 dark:stroke-stone-600" />
			{#if hasPrev && points[hover].prev != null}
				<circle cx={x(hover)} cy={y(points[hover].prev ?? 0)} r="4" fill="var(--viz-muted)" stroke="var(--viz-surface)" stroke-width="2" />
			{/if}
		{/if}
		{#if points.length}
			<circle cx={x(active)} cy={y(points[active].cur)} r="4.5" fill="var(--viz-1)" stroke="var(--viz-surface)" stroke-width="2" />
		{/if}
	</svg>

	{#if hover !== null && points[hover]}
		{@const p = points[hover]}
		<div
			class="pointer-events-none absolute top-0 z-10 w-48 -translate-x-1/2 rounded-xl border border-stone-200 bg-white/95 px-3 py-2.5 text-xs shadow-lg backdrop-blur dark:border-stone-700 dark:bg-stone-900/95"
			style="left:{tipLeft}px"
		>
			<p class="mb-1.5 text-stone-500">{p.title}</p>
			<div class="flex items-center gap-2">
				<span class="h-0.5 w-3 rounded-full" style="background:var(--viz-1)"></span>
				<span class="flex-1 text-stone-500">{curLabel}</span>
			</div>
			<p class="mb-1 pl-5 text-sm font-semibold tabular-nums">{fmt(p.cur)}</p>
			{#if hasPrev}
				<div class="flex items-center gap-2">
					<span class="h-0.5 w-3 rounded-full" style="background:var(--viz-muted)"></span>
					<span class="flex-1 text-stone-500">{prevLabel}</span>
				</div>
				<p class="flex items-center justify-between pl-5 font-medium tabular-nums">
					{fmt(p.prev ?? 0)}
					<Delta value={p.prev ? ((p.cur - p.prev) / p.prev) * 100 : null} size="xs" />
				</p>
			{/if}
		</div>
	{/if}
</div>
