<script lang="ts">
	/**
	 * Ringkasan transaksi sebulan (dashboard lama: tab Qty/Nilai Sales & Pembelian): KPI, tren harian per seri
	 * (atau total vs bulan sebelumnya), dan peringkat per dimensi. Klik baris peringkat = filter silang
	 * untuk semua angka di tab ini.
	 */
	import { CalendarDays, Crown, Gauge, RotateCcw, Sigma, X } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Component } from 'svelte';
	import { money, num, rp, short } from '#lib/util/format.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';
	import Delta from '#lib/components/chart/Delta.svelte';
	import MultiLine, { type LineSeries } from '#lib/components/chart/MultiLine.svelte';
	import RankList, { type RankItem } from '#lib/components/chart/RankList.svelte';
	import Sparkline from '#lib/components/chart/Sparkline.svelte';
	import TrendChart, { type TrendPoint } from '#lib/components/chart/TrendChart.svelte';
	import type { FlowTab, Measure } from './config.ts';
	import { SLOTS, colorAt, dayLabel, daysIn, nowYm, prevYm, stableOrder, sumBy, total, ymLabel, type Rec } from './data.ts';
	import PeriodPicker from './PeriodPicker.svelte';
	import Seg from './Seg.svelte';

	let { tab, rows, months, period = $bindable(), measure = $bindable() }: { tab: FlowTab; rows: Rec[]; months: string[]; period: string; measure: Measure } = $props();

	const MEASURES: { key: Measure; label: string }[] = [
		{ key: 'qty', label: 'Qty' },
		{ key: 'nilai', label: 'Nilai' }
	];
	const val = $derived(measure === 'qty' ? (r: Rec) => r.qty : (r: Rec) => r.nilai);
	const unit = $derived(tab.unit ? ' ' + tab.unit : '');
	/** angka lengkap (tooltip, KPI qty) & ringkas (grafik, peringkat nilai) */
	const full = $derived(measure === 'qty' ? (v: number) => num(v) + unit : rp);
	const brief = $derived(measure === 'qty' ? (v: number) => money(v) : (v: number) => 'Rp ' + short(v));
	const other = (rs: Rec[]) => (measure === 'qty' ? 'Rp ' + short(total(rs, (r) => r.nilai)) : num(total(rs, (r) => r.qty)) + unit);

	/* ---------- filter silang ---------- */
	const dims = $derived([tab.series, ...tab.breakdowns]);
	let filters = $state<Record<string, string>>({});
	const active = $derived(dims.filter((d) => filters[d.key]));
	const match = (r: Rec, except = '') => dims.every((d) => d.key === except || !filters[d.key] || r[d.key] === filters[d.key]);
	const pick = (key: string, v: string) => (filters = { ...filters, [key]: filters[key] === v ? '' : v });

	/* ---------- periode & pembanding ---------- */
	const prev = $derived(prevYm(period));
	// bulan berjalan: dibanding bulan lalu sampai tanggal yang sama (bukan sebulan penuh)
	const isNow = $derived(period === nowYm());
	const cutoff = $derived(isNow ? new Date().getDate() : 31);
	const days = $derived(isNow ? Math.min(cutoff, daysIn(period)) : daysIn(period));
	const periodRows = $derived(rows.filter((r) => r.ym === period));
	const prevRows = $derived(rows.filter((r) => r.ym === prev && r.d <= cutoff));
	const cur = $derived(periodRows.filter((r) => match(r)));
	const before = $derived(prevRows.filter((r) => match(r)));
	const hasPrev = $derived(months.includes(prev));
	/** periode pembanding persen naik/turun, mis. "1–25 September 2026" (bulan berjalan) atau "September 2026" */
	const prevSpan = $derived(`${isNow ? `1–${cutoff} ` : ''}${ymLabel(prev)}`);
	const prevText = $derived(`vs ${prevSpan}`);

	/* ---------- KPI ---------- */
	const daily = $derived.by(() => {
		const a = new Array(days).fill(0);
		for (const r of cur) if (r.d <= days) a[r.d - 1] += val(r);
		return a as number[];
	});
	const sum = $derived(total(cur, val));
	const sumPrev = $derived(total(before, val));
	const activeDays = $derived(daily.filter((v) => v !== 0).length);
	const best = $derived(daily.reduce((b, v, i) => (v > daily[b] ? i : b), 0));
	const pct = (a: number, b: number) => (b ? ((a - b) / Math.abs(b)) * 100 : null);

	/* ---------- seri (warna tetap per entitas, urut total seluruh data) ---------- */
	const order = $derived(stableOrder(rows, tab.series.key, (r) => r.nilai));
	const named = $derived(order.length > SLOTS ? order.slice(0, SLOTS - 1) : order);
	const colorOf = (k: string) => colorAt(named.indexOf(k));
	const hidden = new SvelteSet<string>();
	const lines = $derived.by<LineSeries[]>(() => {
		const by = new Map<string, number[]>();
		const rest = new Array(days).fill(0);
		for (const r of cur) {
			if (r.d > days) continue;
			const k = r[tab.series.key];
			if (!named.includes(k)) rest[r.d - 1] += val(r);
			else {
				if (!by.has(k)) by.set(k, new Array(days).fill(0));
				by.get(k)![r.d - 1] += val(r);
			}
		}
		const out: LineSeries[] = named.filter((k) => by.has(k)).map((k) => ({ key: k, label: k, color: colorOf(k), values: by.get(k)! }));
		if (rest.some((v) => v)) out.push({ key: '\u0000lain', label: 'Lainnya', color: 'var(--viz-muted)', values: rest });
		return out;
	});
	const shownLines = $derived(lines.filter((l) => !hidden.has(l.key)));
	const xLabels = $derived(Array.from({ length: days }, (_, i) => String(i + 1)));
	const xTitles = $derived(Array.from({ length: days }, (_, i) => dayLabel(period, i + 1)));
	let view = $state<'series' | 'total'>('series');
	const trend = $derived.by<TrendPoint[]>(() => {
		const p = new Array(days).fill(0);
		for (const r of before) if (r.d <= days) p[r.d - 1] += val(r);
		const pd = daysIn(prev);
		return daily.map((v, i) => ({ label: String(i + 1), title: xTitles[i], cur: v, prev: hasPrev && i < pd ? p[i] : null }));
	});

	/* ---------- peringkat ---------- */
	function rank(key: string, colored: boolean): RankItem[] {
		const c = sumBy(periodRows.filter((r) => match(r, key)), key, val);
		const p = sumBy(prevRows.filter((r) => match(r, key)), key, val);
		return [...c]
			.filter(([, v]) => v !== 0)
			.sort((a, b) => b[1] - a[1])
			.map(([k, v]) => ({ key: k, label: k || '(kosong)', value: v, prev: hasPrev ? (p.get(k) ?? 0) : null, color: colored ? colorOf(k) : undefined }));
	}
	const ranks = $derived(dims.map((d, i) => ({ dim: d, items: rank(d.key, i === 0) })));
	const top = $derived(ranks[0].items[0]);
</script>

{#snippet kpi(Icon: Component<any>, color: string, label: string, value: string, fullText: string, foot: string, delta?: number | null, spark?: number[], isName = false)}
	<div class="card relative flex min-w-0 flex-col overflow-hidden p-3.5 sm:p-4">
		<div class="flex items-start gap-3">
			<span class="hidden size-10 shrink-0 place-items-center rounded-xl sm:grid" style="background:color-mix(in oklab, {color} 13%, transparent);color:{color}"><Icon class="size-5" /></span>
			<div class="min-w-0 flex-1">
				<p class="truncate text-xs text-stone-500">{label}</p>
				<!-- nama (toko/brand) lebih kecil dari angka agar tidak cepat terpotong -->
				<p class="truncate font-semibold tracking-tight {isName ? 'text-base leading-8 sm:text-lg' : 'text-xl sm:text-2xl'}" {@attach tooltip(fullText)}>{value}</p>
			</div>
		</div>
		<div class="mt-1.5 flex items-center gap-1.5 text-xs sm:mt-2">
			{#if delta !== undefined}<Delta value={delta} />{/if}
			<span class="truncate text-stone-400">{foot}</span>
		</div>
		{#if spark}<div class="-mx-1 mt-auto pt-2"><Sparkline values={spark} height={34} {color} /></div>{/if}
	</div>
{/snippet}

<!-- filter: satu baris, berlaku untuk semua angka di bawahnya -->
<div class="card mb-4 flex flex-wrap items-center gap-2 p-2 sm:gap-3">
	<PeriodPicker {months} bind:value={period} />
	<Seg options={MEASURES} bind:value={measure} label="Ukuran" />
	{#each active as d (d.key)}
		<button class="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 pr-2 pl-3 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300" onclick={() => pick(d.key, filters[d.key])} aria-label="Hapus filter {d.label}">
			<span class="max-w-48 truncate">{d.label}: {filters[d.key]}</span><X class="size-3.5" />
		</button>
	{/each}
	{#if active.length > 1}
		<button class="btn btn-ghost btn-sm" onclick={() => (filters = {})}><RotateCcw class="size-3.5" /> Reset</button>
	{/if}</div>

<div class="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
	{@render kpi(Sigma, 'var(--viz-1)', `Total ${tab.noun} (${measure === 'qty' ? 'Qty' : 'Nilai'})`, measure === 'qty' ? num(sum) : 'Rp ' + short(sum), full(sum), hasPrev ? prevText : other(cur), hasPrev ? pct(sum, sumPrev) : undefined, daily)}
	{@render kpi(Gauge, 'var(--viz-3)', 'Rata-rata per Hari', brief(activeDays ? sum / activeDays : 0), full(activeDays ? sum / activeDays : 0), `${activeDays} dari ${days} hari ada transaksi`)}
	{@render kpi(CalendarDays, 'var(--viz-4)', 'Hari Tertinggi', daily[best] ? dayLabel(period, best + 1) : '–', daily[best] ? full(daily[best]) : 'Belum ada transaksi', daily[best] ? full(daily[best]) : 'Belum ada transaksi')}
	{@render kpi(Crown, 'var(--viz-5)', `${tab.series.label} Teratas`, top?.label ?? '–', top ? full(top.value) : '', top && sum ? `${((top.value / total(periodRows.filter((r) => match(r, tab.series.key)), val)) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}% · ${brief(top.value)}` : 'Belum ada transaksi', undefined, undefined, true)}
</div>

<div class="mb-4 grid gap-4 xl:grid-cols-12">
	<section class="card min-w-0 p-4 sm:p-5 xl:col-span-8">
		<div class="mb-2 flex flex-wrap items-center justify-between gap-3">
			<h2 class="font-medium">{tab.noun} Harian · {ymLabel(period)}</h2>
			<Seg options={[{ key: 'series', label: `Per ${tab.series.label}` }, { key: 'total', label: 'Total' }]} bind:value={view} label="Tampilan tren" />
		</div>
		<div class="mb-3">
			{#if view === 'series'}
				<div class="flex flex-wrap gap-1.5">
					{#each lines as l (l.key)}
						{@const off = hidden.has(l.key)}
						<button
							type="button"
							class="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition {off ? 'border-dashed border-stone-300 text-stone-400 dark:border-stone-700' : 'border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800'}"
							aria-pressed={!off}
							onclick={() => (off ? hidden.delete(l.key) : hidden.add(l.key))}
							{@attach tooltip(off ? 'Tampilkan garis' : 'Sembunyikan garis')}
						>
							<span class="h-0.5 w-3 rounded-full" style="background:{off ? 'var(--viz-muted)' : l.color}"></span>
							<span class="max-w-40 truncate">{l.label}</span>
							<span class="tabular-nums text-stone-400">{brief(l.values.reduce((a, b) => a + b, 0))}</span>
						</button>
					{/each}
				</div>
			{:else}
				<div class="flex h-7 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
					<span class="inline-flex items-center gap-1.5"><span class="h-0.5 w-4 rounded-full" style="background:var(--viz-1)"></span>{ymLabel(period)}</span>
					{#if hasPrev}<span class="inline-flex items-center gap-1.5"><span class="h-0.5 w-4 rounded-full" style="background:var(--viz-muted)"></span>{prevSpan}</span>{/if}
				</div>
			{/if}
		</div>
		{#if view === 'series'}
			<MultiLine series={shownLines} labels={xLabels} titles={xTitles} fmt={full} ariaLabel="{tab.noun} harian per {tab.series.label} {ymLabel(period)}" />
		{:else}
			<TrendChart points={trend} fmt={full} curLabel={ymLabel(period)} prevLabel={ymLabel(prev)} ariaLabel="Total {tab.noun.toLowerCase()} harian {ymLabel(period)} dibanding {ymLabel(prev)}" height={280} />
		{/if}
	</section>

	<section class="card min-w-0 p-4 sm:p-5 xl:col-span-4">
		<h2 class="font-medium">Per {ranks[0].dim.label}</h2>
		<p class="mb-3 text-xs text-stone-500">Klik untuk memfilter{hasPrev ? ` · perubahan ${prevText}` : ''}</p>
		<RankList items={ranks[0].items} fmt={brief} selected={filters[ranks[0].dim.key] ?? ''} onselect={(k) => pick(ranks[0].dim.key, k)} noun={ranks[0].dim.label} />
	</section>
</div>

<div class="mb-4 grid gap-4 {ranks.length > 2 ? 'xl:grid-cols-2' : ''}">
	{#each ranks.slice(1) as r (r.dim.key)}
		<section class="card min-w-0 p-4 sm:p-5">
			<h2 class="font-medium">Per {r.dim.label}</h2>
			<p class="mb-3 text-xs text-stone-500">{r.items.length.toLocaleString('id-ID')} {r.dim.label} · klik untuk memfilter</p>
			<RankList items={r.items} fmt={brief} selected={filters[r.dim.key] ?? ''} onselect={(k) => pick(r.dim.key, k)} limit={10} noun={r.dim.label} wide={ranks.length === 2} />
		</section>
	{/each}
</div>
