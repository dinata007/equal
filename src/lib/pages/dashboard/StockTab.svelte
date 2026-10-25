<script lang="ts">
	/**
	 * Komposisi stok (dashboard lama: tab Stok): KPI, porsi per brand (donut) & stok per dept/gudang dipecah per brand.
	 * Klik segmen donut / baris = filter silang.
	 */
	import { Boxes, Crown, Layers, RotateCcw, TriangleAlert, X } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { num } from '#lib/util/format.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';
	import Donut, { type Slice } from '#lib/components/chart/Donut.svelte';
	import StackRows from '#lib/components/chart/StackRows.svelte';
	import type { StockTab } from './config.ts';
	import { SLOTS, colorAt, stableOrder, sumBy, total, type Rec } from './data.ts';

	let { tab, rows, asOf }: { tab: StockTab; rows: Rec[]; asOf: string } = $props();

	const LAIN = '\u0000lain';
	const share = $derived(tab.share.key);
	const stack = $derived(tab.stack.key);
	let fShare = $state('');
	let fStack = $state('');
	const active = $derived([fShare && { label: tab.share.label, value: fShare, clear: () => (fShare = '') }, fStack && { label: tab.stack.label, value: fStack, clear: () => (fStack = '') }].filter(Boolean) as { label: string; value: string; clear: () => void }[]);

	const stok = (r: Rec) => r.stok;
	const order = $derived(stableOrder(rows, share, stok));
	const named = $derived(order.length > SLOTS ? order.slice(0, SLOTS - 1) : order);
	const keyOf = (v: string) => (named.includes(v) ? v : LAIN);
	const colorOf = (k: string) => (k === LAIN ? 'var(--viz-muted)' : colorAt(named.indexOf(k)));
	const labelOf = (k: string) => (k === LAIN ? 'Lainnya' : k || '(kosong)');
	const inShare = (r: Rec) => !fShare || keyOf(r[share]) === fShare;
	const inStack = (r: Rec) => !fStack || r[stack] === fStack;
	const cur = $derived(rows.filter((r) => inShare(r) && inStack(r)));

	const slices = $derived.by<Slice[]>(() => {
		const m = sumBy(
			rows.filter(inStack).map((r) => ({ k: keyOf(r[share]), stok: r.stok })),
			'k',
			stok
		);
		return [...named, LAIN].filter((k) => m.has(k)).map((k) => ({ key: k, label: labelOf(k), value: Math.max(0, m.get(k)!), color: colorOf(k) }));
	});
	const parts = $derived(slices.filter((s) => !fShare || s.key === fShare).map((s) => ({ key: s.key, label: s.label, color: s.color })));
	const bars = $derived.by(() => {
		const m = new Map<string, Record<string, number>>();
		for (const r of rows.filter(inShare)) {
			const g = r[stack];
			const k = keyOf(r[share]);
			const o = m.get(g) ?? {};
			o[k] = (o[k] ?? 0) + r.stok;
			m.set(g, o);
		}
		return [...m]
			.map(([k, values]) => ({ key: k, label: k || '(kosong)', values, net: Object.values(values).reduce((a, b) => a + b, 0) }))
			.sort((a, b) => b.net - a.net || a.label.localeCompare(b.label));
	});

	const sum = $derived(total(cur, stok));
	const topShare = $derived([...sumBy(cur, share, stok)].sort((a, b) => b[1] - a[1])[0]);
	const topStack = $derived([...sumBy(cur, stack, stok)].sort((a, b) => b[1] - a[1])[0]);
	const minus = $derived(cur.filter((r) => r.stok < 0));
	const pctOf = (v: number) => (sum > 0 ? `${((v / sum) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari total` : '');
	const pcs = (v: number) => num(v);
</script>

{#snippet kpi(Icon: Component<any>, color: string, label: string, value: string, foot: string, warn = false, isName = false)}
	<div class="card flex min-w-0 items-start gap-3 p-3.5 sm:p-4">
		<span class="hidden size-10 shrink-0 place-items-center rounded-xl sm:grid" style="background:color-mix(in oklab, {color} 13%, transparent);color:{color}"><Icon class="size-5" /></span>
		<div class="min-w-0 flex-1">
			<p class="truncate text-xs text-stone-500">{label}</p>
			<p class="truncate font-semibold tracking-tight {isName ? 'text-base leading-8 sm:text-lg' : 'text-xl sm:text-2xl'}" {@attach tooltip(value)}>{value}</p>
			<p class="mt-0.5 truncate text-xs {warn ? 'text-rose-600 dark:text-rose-400' : 'text-stone-400'}">{foot}</p>
		</div>
	</div>
{/snippet}

<div class="card mb-4 flex flex-wrap items-center gap-2 p-2 sm:gap-3">
	<span class="inline-flex h-8 items-center gap-2 rounded-xl bg-stone-100 px-3 text-sm font-medium dark:bg-stone-800"><Boxes class="size-4 text-stone-400" />{asOf}</span>
	{#each active as f (f.label)}
		<button class="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 pr-2 pl-3 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300" onclick={f.clear} aria-label="Hapus filter {f.label}">
			<span class="max-w-48 truncate">{f.label}: {labelOf(f.value)}</span><X class="size-3.5" />
		</button>
	{/each}
	{#if active.length > 1}
		<button class="btn btn-ghost btn-sm" onclick={() => ((fShare = ''), (fStack = ''))}><RotateCcw class="size-3.5" /> Reset</button>
	{/if}
</div>

<div class="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
	{@render kpi(Boxes, 'var(--viz-1)', 'Total Stok', pcs(sum), `${num(cur.length)} baris data`)}
	{@render kpi(Crown, 'var(--viz-5)', `${tab.share.label} Terbanyak`, topShare?.[0] || '–', topShare ? `${pcs(topShare[1])} · ${pctOf(topShare[1])}` : '', false, true)}
	{@render kpi(Layers, 'var(--viz-3)', `${tab.stack.label} Terbanyak`, topStack?.[0] || '–', topStack ? `${pcs(topStack[1])} · ${pctOf(topStack[1])}` : '', false, true)}
	{#if minus.length}
		{@render kpi(TriangleAlert, 'var(--viz-2)', 'Stok Minus', pcs(-total(minus, stok)), `${num(minus.length)} baris bernilai minus`, true)}
	{:else}
		{@render kpi(Layers, 'var(--viz-4)', `Jumlah ${tab.stack.label}`, num(bars.filter((b) => !fStack || b.key === fStack).length), `${num(new Set(cur.map((r) => r[share])).size)} ${tab.share.label.toLowerCase()} berstok`)}
	{/if}
</div>

<div class="mb-4 grid gap-4 xl:grid-cols-12">
	<section class="card min-w-0 p-4 sm:p-5 xl:col-span-4">
		<h2 class="font-medium">Porsi per {tab.share.label}</h2>
		<p class="mb-4 text-xs text-stone-500">Klik untuk memfilter</p>
		<Donut items={slices} fmt={pcs} centerLabel="Total stok" selected={fShare} onselect={(k) => (fShare = fShare === k ? '' : k)} />
	</section>
	<section class="card min-w-0 p-4 sm:p-5 xl:col-span-8">
		<h2 class="font-medium">Stok per {tab.stack.label}</h2>
		<p class="mb-3 text-xs text-stone-500">Dipecah per {tab.share.label.toLowerCase()} · klik baris untuk memfilter</p>
		<StackRows rows={bars} {parts} fmt={pcs} selected={fStack} onselect={(k) => (fStack = fStack === k ? '' : k)} />
	</section>
</div>
