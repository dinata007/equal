<script lang="ts">
	import { page } from '$app/state';
	import { db } from '#lib/erp/db.svelte.ts';
	import { date as fdate, downloadCsv, money, monthStart, today, addDays } from '#lib/erp/format.ts';
	import { partyMoves } from '#lib/erp/ledger.ts';
	import type { Leaf } from '#lib/erp/menu.ts';
	import Lookup from '#lib/components/Lookup.svelte';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	let { leaf, kind }: { leaf: Leaf; kind: 'ar' | 'ap' } = $props();

	const sp = page.url.searchParams;
	// svelte-ignore state_referenced_locally
	const table = kind === 'ar' ? 'customers' : 'suppliers';
	const noun = $derived(kind === 'ar' ? 'Piutang' : 'Hutang');
	let from = $state(sp.get('from') ?? addDays(monthStart(), -60));
	let to = $state(sp.get('to') ?? today());
	// svelte-ignore state_referenced_locally
	let partyId = $state(sp.get('party') ?? partyMoves(kind)[0]?.partyId ?? '');

	const moves = $derived(partyMoves(kind).filter((m) => m.partyId === partyId && m.date <= to));
	const opening = $derived(moves.filter((m) => m.date < from).reduce((s, m) => s + m.inc - m.dec, 0));
	const rows = $derived.by(() => {
		let bal = opening;
		return moves.filter((m) => m.date >= from).map((m) => ({ ...m, bal: (bal += m.inc - m.dec) }));
	});
	const closing = $derived(rows.at(-1)?.bal ?? opening);

	function exportCsv() {
		downloadCsv(`Kartu ${noun} ${db.name(table, partyId)}`, ['Tanggal', 'No', 'Transaksi', 'Tambah', 'Kurang', 'Saldo'], [
			[from, '', 'Saldo awal', '', '', opening],
			...rows.map((r) => [r.date, r.no, r.label, r.inc, r.dec, r.bal])
		]);
	}
</script>

<ReportShell {leaf} subtitle="{db.name(table, partyId) || '-'} · {fdate(from)} – {fdate(to)}" onexport={exportCsv}>
	{#snippet filters()}
		<div class="lg:w-72">
			<span class="label">{kind === 'ar' ? 'Customer' : 'Supplier'}</span>
			<Lookup {table} bind:value={partyId} />
		</div>
		<PeriodFilter bind:from bind:to />
	{/snippet}

	<div class="mb-4 grid grid-cols-2 gap-3">
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Awal</p><p class="mt-1 text-lg font-semibold tabular-nums">Rp {money(opening)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Akhir {noun}</p><p class="mt-1 text-lg font-semibold tabular-nums">Rp {money(closing)}</p></div>
	</div>

	<div class="card overflow-hidden">
		<!-- desktop -->
		<div class="hidden overflow-x-auto md:block">
		<table class="table-erp">
			<thead>
				<tr><th>Tanggal</th><th>No. Dokumen</th><th class="hidden sm:table-cell">Transaksi</th><th class="text-right">Tambah</th><th class="text-right">Kurang</th><th class="text-right">Saldo</th></tr>
			</thead>
			<tbody>
				<tr class="bg-stone-50/60 dark:bg-stone-800/30"><td>{fdate(from)}</td><td colspan="4" class="text-stone-500 italic">Saldo awal</td><td class="num font-semibold">{money(opening)}</td></tr>
				{#each rows as r, i (r.docId + i)}
					<tr>
						<td class="whitespace-nowrap">{fdate(r.date)}</td>
						<td><a class="font-mono text-xs font-semibold whitespace-nowrap text-brand-600 hover:underline" href="{r.path}?id={r.docId}">{r.no}</a></td>
						<td class="hidden text-stone-500 sm:table-cell">{r.label}</td>
						<td class="num">{r.inc ? money(r.inc) : ''}</td>
						<td class="num">{r.dec ? money(r.dec) : ''}</td>
						<td class="num font-medium">{money(r.bal)}</td>
					</tr>
				{:else}
					<tr><td colspan="6" class="py-10 text-center text-stone-400">Tidak ada transaksi</td></tr>
				{/each}
			</tbody>
		</table>
		</div>
		<!-- mobile -->
		<ul class="divide-y divide-stone-100 md:hidden dark:divide-stone-800">
			<li class="flex justify-between bg-stone-50 px-4 py-2.5 text-sm dark:bg-stone-800/40"><span class="text-stone-500">Saldo awal</span><span class="font-semibold tabular-nums">{money(opening)}</span></li>
			{#each rows as r, i (r.docId + i)}
				<li>
					<a href="{r.path}?id={r.docId}" class="flex items-center gap-3 px-4 py-3 focus-visible:-outline-offset-2">
						<div class="min-w-0 flex-1">
							<p class="truncate font-mono text-xs font-semibold">{r.no}</p>
							<p class="truncate text-xs text-stone-500">{fdate(r.date)} · {r.label}</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold tabular-nums {r.inc ? '' : 'text-rose-600'}">{r.inc ? '+' + money(r.inc) : '-' + money(r.dec)}</p>
							<p class="text-[11px] text-stone-400 tabular-nums">saldo {money(r.bal)}</p>
						</div>
					</a>
				</li>
			{:else}
				<li class="py-10 text-center text-sm text-stone-400">Tidak ada transaksi</li>
			{/each}
		</ul>
	</div>
</ReportShell>
