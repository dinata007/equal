<script lang="ts">
	/** Garis tren mini untuk kartu KPI (dekoratif; nilainya ada di kartu). */
	let { values, height = 40, color = 'var(--viz-1)' }: { values: number[]; height?: number; color?: string } = $props();

	let w = $state(120);
	const pad = 5;
	const max = $derived(Math.max(...values, 0));
	const min = $derived(Math.min(...values, 0));
	const pts = $derived(
		values.map((v, i) => [pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2), pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2)] as const)
	);
	const line = $derived(pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(''));
	const last = $derived(pts.at(-1));
</script>

<div class="w-full" bind:clientWidth={w} aria-hidden="true">
	{#if values.length > 1}
		<svg width={w} {height} class="block overflow-visible">
			<path d="{line}L{pts.at(-1)![0]},{height}L{pts[0][0]},{height}Z" fill={color} opacity="0.1" />
			<path d={line} fill="none" stroke={color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
			{#if last}<circle cx={last[0]} cy={last[1]} r="4" fill={color} stroke="var(--viz-surface)" stroke-width="2" />{/if}
		</svg>
	{/if}
</div>
