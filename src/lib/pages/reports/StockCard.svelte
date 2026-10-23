<script lang="ts">
	import { page } from '$app/state';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { date as fdate, downloadCsv, monthStart, num, today } from '#lib/erp/format.ts';
	import { locMatch, stockMoves } from '#lib/erp/ledger.ts';
	import type { Leaf } from '#lib/erp/menu.ts';
	import Lookup from '#lib/components/Lookup.svelte';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	let { leaf, itemTable, scope }: { leaf: Leaf; itemTable: string; scope: string } = $props();

	const sp = page.url.searchParams;
	let from = $state(sp.get('from') ?? monthStart());
	let to = $state(sp.get('to') ?? today());
	// svelte-ignore state_referenced_locally
	let storeId = $state(sp.get('store') ?? (scope === 'TOKO' ? (auth.user?.storeId ?? db.all('stores')[0]?.id) : ''));
	// svelte-ignore state_referenced_locally
	let itemId = $state(sp.get('item') ?? db.all(itemTable)[0]?.id ?? '');

	const item = $derived(db.get(itemTable, itemId));
	const moves = $derived(stockMoves(itemTable, locMatch(scope, storeId)).filter((m) => m.itemId === itemId && m.date <= to));
	const opening = $derived(moves.filter((m) => m.date < from).reduce((s, m) => s + m.qty, 0));
	const rows = $derived.by(() => {
		let bal = opening;
		return moves.filter((m) => m.date >= from).map((m) => ({ ...m, bal: (bal += m.qty) }));
	});
	const totIn = $derived(rows.reduce((s, r) => s + Math.max(0, r.qty), 0));
	const totOut = $derived(rows.reduce((s, r) => s + Math.max(0, -r.qty), 0));
	const closing = $derived(opening + totIn - totOut);
	const location = $derived(scope === 'MAT' ? 'Gudang Material' : scope === 'INV' ? 'Gudang Inventory' : db.name('stores', storeId) || 'Semua Toko');

	function exportCsv() {
		downloadCsv(`Kartu Stok ${item?.code} ${from} sd ${to}`, ['Tanggal', 'No', 'Transaksi', 'Masuk', 'Keluar', 'Saldo'], [
			[from, '', 'Saldo awal', '', '', opening],
			...rows.map((r) => [r.date, r.no, r.label, Math.max(0, r.qty), Math.max(0, -r.qty), r.bal])
		]);
	}
</script>

<ReportShell {leaf} subtitle="{item?.name ?? '-'} · {location} · {fdate(from)} – {fdate(to)}" onexport={exportCsv}>
	{#snippet filters()}
		<div class="lg:w-72">
			<span class="label">{itemTable === 'products' ? 'Produk' : 'Material'}</span>
			<Lookup table={itemTable} bind:value={itemId} />
		</div>
		{#if scope === 'TOKO'}
			<div class="lg:w-56">
				<span class="label">Toko</span>
				<Lookup table="stores" bind:value={storeId} placeholder="Semua toko" clearable />
			</div>
		{/if}
		<PeriodFilter bind:from bind:to />
	{/snippet}

	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Awal</p><p class="mt-1 text-xl font-semibold tabular-nums">{num(opening)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Masuk</p><p class="mt-1 text-xl font-semibold text-emerald-600 tabular-nums">+{num(totIn)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Keluar</p><p class="mt-1 text-xl font-semibold text-rose-600 tabular-nums">-{num(totOut)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Akhir</p><p class="mt-1 text-xl font-semibold tabular-nums">{num(closing)} <span class="text-sm font-normal text-stone-400">{item?.unit}</span></p></div>
	</div>

	<div class="card overflow-hidden">
		<!-- desktop -->
		<div class="hidden overflow-x-auto md:block">
			<table class="table-erp">
				<thead>
					<tr><th>Tanggal</th><th>No. Dokumen</th><th>Transaksi</th><th class="text-right">Masuk</th><th class="text-right">Keluar</th><th class="text-right">Saldo</th></tr>
				</thead>
				<tbody>
					<tr class="bg-stone-50/60 dark:bg-stone-800/30">
						<td>{fdate(from)}</td><td colspan="4" class="text-stone-500 italic">Saldo awal</td><td class="num font-semibold">{num(opening)}</td>
					</tr>
					{#each rows as r, i (r.docId + i)}
						<tr>
							<td>{fdate(r.date)}</td>
							<td><a class="font-mono text-xs font-semibold text-brand-600 hover:underline" href="{r.path}?id={r.docId}">{r.no}</a></td>
							<td class="text-stone-500">{r.label}</td>
							<td class="num text-emerald-600">{r.qty > 0 ? num(r.qty) : ''}</td>
							<td class="num text-rose-600">{r.qty < 0 ? num(-r.qty) : ''}</td>
							<td class="num font-medium">{num(r.bal)}</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="py-10 text-center text-stone-400">Tidak ada mutasi pada periode ini</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		<!-- mobile -->
		<ul class="divide-y divide-stone-100 md:hidden dark:divide-stone-800">
			<li class="flex justify-between bg-stone-50 px-4 py-2.5 text-sm dark:bg-stone-800/40"><span class="text-stone-500">Saldo awal</span><span class="font-semibold">{num(opening)}</span></li>
			{#each rows as r, i (r.docId + i)}
				<li>
					<a href="{r.path}?id={r.docId}" class="flex items-center gap-3 px-4 py-3 focus-visible:-outline-offset-2">
						<div class="min-w-0 flex-1">
							<p class="truncate font-mono text-xs font-semibold">{r.no}</p>
							<p class="truncate text-xs text-stone-500">{fdate(r.date)} · {r.label}</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold tabular-nums {r.qty > 0 ? 'text-emerald-600' : 'text-rose-600'}">{r.qty > 0 ? '+' : ''}{num(r.qty)}</p>
							<p class="text-[11px] text-stone-400 tabular-nums">saldo {num(r.bal)}</p>
						</div>
					</a>
				</li>
			{:else}
				<li class="py-10 text-center text-sm text-stone-400">Tidak ada mutasi</li>
			{/each}
		</ul>
	</div>
</ReportShell>
