<script lang="ts">
	/** Rincian Total Penjualan per kategori: nilai, qty, transaksi, kontribusi & pertumbuhan; klik baris → produk teratas kategori itu. */
	import { ChevronDown } from '@lucide/svelte';
	import Delta from '#lib/components/chart/Delta.svelte';
	import Sheet from '#lib/components/ui/Sheet.svelte';
	import { pctChange, stats, type Sales } from './penjualan.ts';
	import { date as fdate, money, num, short } from '#lib/util/format.ts';

	let {
		open = $bindable(false),
		data,
		per,
		channel,
		channelName,
		category,
		color
	}: {
		open?: boolean;
		data: Sales;
		per: { from: string; to: string; prevFrom: string; prevTo: string; prevLabel: string };
		channel: string;
		channelName: string;
		/** filter kategori di dashboard; kosong = semua kategori */
		category: string;
		color: (cat: string) => string;
	} = $props();

	let measure = $state<'amount' | 'qty'>('amount');
	let openCat = $state('');

	const cats = $derived(category ? [category] : data.categories);
	const all = $derived(data.pick(per.from, per.to, channel, category));
	const total = $derived(stats(all));
	const prevTotal = $derived(stats(data.pick(per.prevFrom, per.prevTo, channel, category)));

	const rows = $derived.by(() => {
		const out = cats
			.map((c) => {
				const st = stats(data.pick(per.from, per.to, channel, c));
				const ps = stats(data.pick(per.prevFrom, per.prevTo, channel, c));
				return { cat: c, st, growth: pctChange(st.sales, ps.sales) };
			})
			.filter((r) => r.st.sales || r.st.qty)
			.sort((a, b) => b.st[measure === 'amount' ? 'sales' : 'qty'] - a.st[measure === 'amount' ? 'sales' : 'qty']);
		const max = out[0] ? out[0].st[measure === 'amount' ? 'sales' : 'qty'] : 1;
		const sum = out.reduce((t, r) => t + r.st[measure === 'amount' ? 'sales' : 'qty'], 0);
		return out.map((r) => {
			const v = r.st[measure === 'amount' ? 'sales' : 'qty'];
			return { ...r, bar: max ? (v / max) * 100 : 0, share: sum ? (v / sum) * 100 : 0 };
		});
	});

	/** produk teratas satu kategori (untuk baris yang dibuka) */
	function products(cat: string) {
		const m = new Map<string, { qty: number; amount: number }>();
		for (const l of all.rows) {
			if (l.cat !== cat) continue;
			const r = m.get(l.item) ?? { qty: 0, amount: 0 };
			r.qty += l.qty;
			r.amount += l.amount;
			m.set(l.item, r);
		}
		return [...m].map(([name, r]) => ({ name, ...r })).sort((a, b) => b[measure] - a[measure]).slice(0, 5);
	}

	const subtitle = $derived(`${fdate(per.from)} – ${fdate(per.to)} · ${channel ? channelName : 'Semua toko'}`);
</script>

<Sheet bind:open title="Total Penjualan per Kategori" {subtitle} size="lg" onclose={() => (openCat = '')}>
	<div class="mb-4 rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/50">
		<p class="text-xs text-stone-500">Total penjualan{category ? ` · ${category}` : ''}</p>
		<p class="text-3xl font-semibold tracking-tight tabular-nums" title={money(total.sales)}>{money(total.sales)}</p>
		<div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
			<span class="inline-flex items-center gap-1.5"><Delta value={pctChange(total.sales, prevTotal.sales)} /> vs {per.prevLabel.toLowerCase()}</span>
			<span>{num(total.qty)} pcs</span>
			<span>{num(total.trx)} transaksi</span>
		</div>
	</div>

	<div class="mb-2 flex items-center justify-between gap-3">
		<h3 class="text-sm font-medium">{rows.length} kategori</h3>
		<div class="inline-flex rounded-xl bg-stone-100 p-0.5 dark:bg-stone-800" role="group" aria-label="Ukuran">
			{#each [['amount', 'Nilai'], ['qty', 'Qty']] as [k, label] (k)}
				<button
					type="button"
					class="h-8 rounded-[10px] px-3 text-sm font-medium transition {measure === k ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-950 dark:text-stone-100' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}"
					aria-pressed={measure === k}
					onclick={() => (measure = k as 'amount' | 'qty')}>{label}</button
				>
			{/each}
		</div>
	</div>

	<ul class="divide-y divide-stone-100 dark:divide-stone-800">
		{#each rows as r (r.cat)}
			{@const isOpen = openCat === r.cat}
			<li>
				<button type="button" class="block w-full rounded-xl px-1 py-3 text-left transition hover:bg-stone-50 dark:hover:bg-stone-800/40" aria-expanded={isOpen} onclick={() => (openCat = isOpen ? '' : r.cat)}>
					<div class="flex items-center gap-2">
						<span class="size-2.5 shrink-0 rounded-[3px]" style="background:{color(r.cat)}"></span>
						<span class="min-w-0 flex-1 truncate text-sm font-medium">{r.cat}</span>
						<Delta value={r.growth} />
						<span class="w-20 shrink-0 text-right text-sm font-medium tabular-nums" title={money(measure === 'amount' ? r.st.sales : r.st.qty)}>{measure === 'amount' ? short(r.st.sales) : num(r.st.qty) + ' pcs'}</span>
						<ChevronDown class="size-4 shrink-0 text-stone-400 transition {isOpen ? 'rotate-180' : ''}" />
					</div>
					<div class="mt-2 flex items-center gap-3 pl-[18px]">
						<div class="h-1.5 flex-1 rounded-full" style="background:var(--viz-grid)"><div class="h-1.5 rounded-full" style="width:{r.bar}%;background:{color(r.cat)}"></div></div>
						<span class="w-12 shrink-0 text-right text-xs text-stone-500 tabular-nums">{num(Math.round(r.share * 10) / 10)}%</span>
					</div>
					<p class="mt-1.5 pl-[18px] text-[11px] text-stone-400">
						{measure === 'amount' ? `${num(r.st.qty)} pcs` : short(r.st.sales)} · {num(r.st.trx)} transaksi
					</p>
				</button>
				{#if isOpen}
					<ol class="mb-3 ml-[18px] space-y-1.5 border-l border-stone-100 pl-3 dark:border-stone-800">
						{#each products(r.cat) as pr, i (pr.name)}
							<li class="flex items-baseline gap-2 text-sm">
								<span class="w-4 shrink-0 text-xs text-stone-400 tabular-nums">{i + 1}</span>
								<span class="min-w-0 flex-1 truncate">{pr.name}</span>
								<span class="shrink-0 tabular-nums">{measure === 'amount' ? short(pr.amount) : num(pr.qty) + ' pcs'}</span>
								<span class="w-16 shrink-0 text-right text-xs text-stone-400 tabular-nums">{measure === 'amount' ? num(pr.qty) + ' pcs' : short(pr.amount)}</span>
							</li>
						{/each}
					</ol>
				{/if}
			</li>
		{:else}
			<li class="py-10 text-center text-sm text-stone-400">Belum ada penjualan pada filter ini</li>
		{/each}
	</ul>
</Sheet>
