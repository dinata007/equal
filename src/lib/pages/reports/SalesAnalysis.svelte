<script lang="ts">
	import Select from '#lib/components/Select.svelte';
	import { daily, groupSum, saleLines } from '#lib/erp/analytics.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { addDays, date as fdate, downloadCsv, money, num, today } from '#lib/erp/format.ts';
	import type { Leaf } from '#lib/erp/menu.ts';
	import BarChart from '#lib/components/BarChart.svelte';
	import BarList from '#lib/components/BarList.svelte';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	let { leaf }: { leaf: Leaf } = $props();

	let from = $state(addDays(today(), -29));
	let to = $state(today());
	let channel = $state('');

	const span = $derived(Math.round((+new Date(to) - +new Date(from)) / 864e5) + 1);
	const allLines = $derived(saleLines(from, to));
	const lines = $derived(channel ? allLines.filter((l) => l.channel === channel) : allLines);
	const prevLines = $derived.by(() => {
		const p = saleLines(addDays(from, -span), addDays(from, -1));
		return channel ? p.filter((l) => l.channel === channel) : p;
	});
	const channels = $derived([...new Set(allLines.map((l) => l.channel))].sort());

	const omzet = $derived(lines.reduce((s, l) => s + l.amount, 0));
	const prevOmzet = $derived(prevLines.reduce((s, l) => s + l.amount, 0));
	const trx = $derived(new Set(lines.map((l) => l.docId)).size);
	const qty = $derived(lines.reduce((s, l) => s + l.qty, 0));
	const growth = $derived(prevOmzet ? ((omzet - prevOmzet) / prevOmzet) * 100 : 0);
	const cost = $derived(lines.reduce((s, l) => s + l.qty * (db.get('products', l.itemId)?.buyPrice ?? 0), 0));

	const byDay = $derived(daily(lines, from, to));
	const byProduct = $derived(groupSum(lines, (l) => l.itemId, (l) => l.amount).slice(0, 8).map((g) => ({ label: db.name('products', g.key), value: g.value })));
	const byChannel = $derived(groupSum(lines, (l) => l.channel, (l) => l.amount).map((g) => ({ label: g.key, value: g.value, sub: omzet ? `${num((g.value / omzet) * 100)}%` : '' })));
	const byPayment = $derived(groupSum(lines, (l) => l.payment, (l) => l.amount).map((g) => ({ label: g.key, value: g.value })));
	const byCategory = $derived(groupSum(lines, (l) => db.get('products', l.itemId)?.category ?? '-', (l) => l.amount).map((g) => ({ label: g.key, value: g.value })));
	const productTable = $derived(
		groupSum(lines, (l) => l.itemId, (l) => l.amount).map((g) => {
			const ls = lines.filter((l) => l.itemId === g.key);
			const p = db.get('products', g.key);
			const q = ls.reduce((s, l) => s + l.qty, 0);
			return { p, qty: q, amount: g.value, margin: g.value - q * (p?.buyPrice ?? 0) };
		})
	);

	function exportCsv() {
		downloadCsv(`Analisa Penjualan ${from} sd ${to}`, ['Kode', 'Produk', 'Qty', 'Omzet', 'Margin Kotor'], productTable.map((r) => [r.p?.code, r.p?.name, r.qty, Math.round(r.amount), Math.round(r.margin)]));
	}
</script>

<ReportShell {leaf} subtitle="{fdate(from)} – {fdate(to)}{channel ? ' · ' + channel : ''}" onexport={exportCsv}>
	{#snippet filters()}
		<PeriodFilter bind:from bind:to />
		<div class="lg:w-60">
			<label class="label" for="sa-ch">Channel / Toko</label>
			<Select id="sa-ch" bind:value={channel} options={[{ value: '', label: 'Semua channel' }, ...channels]} label="Channel / Toko" />
		</div>
	{/snippet}

	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="card col-span-2 bg-stone-900 dark:bg-brand-900 p-4 text-white lg:col-span-1">
			<p class="text-xs text-white/80">Omzet</p>
			<p class="mt-1 text-2xl font-semibold tracking-tight tabular-nums">Rp {money(omzet)}</p>
			<p class="mt-1 text-xs text-white/80">{growth >= 0 ? '▲' : '▼'} {num(Math.abs(growth))}% vs {span} hari sebelumnya</p>
		</div>
		<div class="card p-4"><p class="text-xs text-stone-500">Transaksi</p><p class="mt-1 text-2xl font-semibold tabular-nums">{num(trx)}</p><p class="text-xs text-stone-400">Rata-rata Rp {money(trx ? omzet / trx : 0)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Qty Terjual</p><p class="mt-1 text-2xl font-semibold tabular-nums">{num(qty)}</p><p class="text-xs text-stone-400">{num(qty / Math.max(1, span))} pcs/hari</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Margin Kotor</p><p class="mt-1 text-2xl font-semibold tabular-nums">{omzet ? num(((omzet - cost) / omzet) * 100) : 0}%</p><p class="text-xs text-stone-400">Rp {money(omzet - cost)}</p></div>
	</div>

	<div class="card mb-4 p-4 sm:p-5">
		<h2 class="mb-3 font-medium">Omzet Harian</h2>
		<BarChart data={byDay} />
	</div>

	<div class="mb-4 grid gap-4 lg:grid-cols-2">
		<div class="card p-4 sm:p-5"><h2 class="mb-4 font-medium">Produk Terlaris</h2><BarList items={byProduct} /></div>
		<div class="card p-4 sm:p-5"><h2 class="mb-4 font-medium">Per Channel / Toko</h2><BarList items={byChannel} /></div>
		<div class="card p-4 sm:p-5"><h2 class="mb-4 font-medium">Per Kategori</h2><BarList items={byCategory} /></div>
		<div class="card p-4 sm:p-5"><h2 class="mb-4 font-medium">Metode Pembayaran</h2><BarList items={byPayment} /></div>
	</div>

	<div class="card overflow-x-auto">
		<table class="table-erp">
			<thead><tr><th>Produk</th><th class="text-right">Qty</th><th class="text-right">Omzet</th><th class="text-right">Margin</th><th class="text-right">%</th></tr></thead>
			<tbody>
				{#each productTable as r (r.p?.id)}
					<tr>
						<td><span class="block">{r.p?.name}</span><span class="font-mono text-[11px] text-stone-400">{r.p?.code}</span></td>
						<td class="num">{num(r.qty)}</td>
						<td class="num">{money(r.amount)}</td>
						<td class="num">{money(r.margin)}</td>
						<td class="num text-stone-500">{r.amount ? num((r.margin / r.amount) * 100) : 0}%</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</ReportShell>
