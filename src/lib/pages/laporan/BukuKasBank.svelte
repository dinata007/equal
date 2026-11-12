<script lang="ts">
	import { db } from '#lib/dev-data/db.svelte.ts';
	import { date as fdate, money, monthStart, today } from '#lib/util/format.ts';
	import { tableOf } from '#lib/util/export.ts';
	import { cashMoves } from '#lib/domain/ledger.ts';
	import type { Leaf } from '#lib/domain/menu.ts';
	import Lookup from '#lib/components/ui/Lookup.svelte';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	let { leaf, type }: { leaf: Leaf; type: 'Kas' | 'Bank' } = $props();

	let from = $state(monthStart());
	let to = $state(today());
	// svelte-ignore state_referenced_locally
	let kbId = $state(db.all('cashbanks').find((k) => k.type === type)?.id ?? '');

	const kb = $derived(db.get('cashbanks', kbId));
	const moves = $derived(cashMoves().filter((m) => m.kasbankId === kbId && m.date <= to));
	const opening = $derived((Number(kb?.opening) || 0) + moves.filter((m) => m.date < from).reduce((s, m) => s + m.in - m.out, 0));
	const rows = $derived.by(() => {
		let bal = opening;
		return moves.filter((m) => m.date >= from).map((m) => ({ ...m, bal: (bal += m.in - m.out) }));
	});
	const totIn = $derived(rows.reduce((s, r) => s + r.in, 0));
	const totOut = $derived(rows.reduce((s, r) => s + r.out, 0));

	// saldo semua akun bertipe ini (ringkasan)
	const summary = $derived(
		db
			.all('cashbanks')
			.filter((k) => k.type === type)
			.map((k) => ({ k, bal: (Number(k.opening) || 0) + cashMoves().filter((m) => m.kasbankId === k.id && m.date <= to).reduce((s, m) => s + m.in - m.out, 0) }))
	);

	function exportData() {
		return tableOf(`Buku ${type} ${kb?.name} ${from} sd ${to}`, ['Tanggal', 'No', 'Keterangan', 'Masuk', 'Keluar', 'Saldo'], [
			[from, '', 'Saldo awal', '', '', opening],
			...rows.map((r) => [r.date, r.no, r.memo, r.in, r.out, r.bal])
		]);
	}
</script>

<ReportShell {leaf} subtitle="{kb?.name ?? '-'} · {fdate(from)} – {fdate(to)}" exportTable={exportData}>
	{#snippet filters()}
		<div class="lg:w-64">
			<span class="label">Akun {type}</span>
			<Lookup table="cashbanks" bind:value={kbId} filter={(r) => r.type === type} />
		</div>
		<PeriodFilter bind:from bind:to />
	{/snippet}

	<div class="no-print -mx-1 -mt-1 mb-3 flex snap-x gap-3 overflow-x-auto scroll-px-1 p-1 pb-2">
		{#each summary as s (s.k.id)}
			<button
				class="card w-[min(15rem,75vw)] shrink-0 snap-start p-4 text-left transition {s.k.id === kbId ? 'ring-2 ring-brand-500' : 'hover:border-stone-300'}"
				onclick={() => (kbId = s.k.id)}
			>
				<p class="truncate text-xs text-stone-500">{s.k.name}</p>
				<p class="mt-1 text-lg font-semibold tabular-nums">Rp {money(s.bal)}</p>
				{#if s.k.accountNo}<p class="truncate text-[11px] text-stone-400">{s.k.bankName} · {s.k.accountNo}</p>{/if}
			</button>
		{/each}
	</div>

	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Awal</p><p class="mt-1 font-semibold tabular-nums">Rp {money(opening)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Penerimaan</p><p class="mt-1 font-semibold text-emerald-600 tabular-nums">Rp {money(totIn)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Pengeluaran</p><p class="mt-1 font-semibold text-rose-600 tabular-nums">Rp {money(totOut)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Akhir</p><p class="mt-1 font-semibold tabular-nums">Rp {money(opening + totIn - totOut)}</p></div>
	</div>

	<div class="card overflow-hidden">
		<!-- desktop -->
		<div class="hidden overflow-x-auto md:block">
		<table class="table-erp">
			<thead>
				<tr><th>Tanggal</th><th>No. Bukti</th><th>Keterangan</th><th class="text-right">Masuk</th><th class="text-right">Keluar</th><th class="text-right">Saldo</th></tr>
			</thead>
			<tbody>
				<tr class="bg-stone-50/60 dark:bg-stone-800/30"><td>{fdate(from)}</td><td colspan="4" class="text-stone-500 italic">Saldo awal</td><td class="num font-semibold">{money(opening)}</td></tr>
				{#each rows as r, i (r.docId + i)}
					<tr>
						<td class="whitespace-nowrap">{fdate(r.date)}</td>
						<td>
							{#if r.path}<a class="font-mono text-xs font-semibold whitespace-nowrap text-brand-600 hover:underline" href="{r.path}?id={r.docId}">{r.no}</a>
							{:else}<span class="font-mono text-xs font-semibold whitespace-nowrap">{r.no}</span>{/if}
						</td>
						<td class="max-w-72 truncate text-stone-600 dark:text-stone-400">{r.memo}</td>
						<td class="num text-emerald-600">{r.in ? money(r.in) : ''}</td>
						<td class="num text-rose-600">{r.out ? money(r.out) : ''}</td>
						<td class="num font-medium">{money(r.bal)}</td>
					</tr>
				{:else}
					<tr><td colspan="6" class="py-10 text-center text-stone-400">Tidak ada transaksi pada periode ini</td></tr>
				{/each}
			</tbody>
		</table>
		</div>
		<!-- mobile -->
		<ul class="divide-y divide-stone-100 md:hidden dark:divide-stone-800">
			<li class="flex justify-between bg-stone-50 px-4 py-2.5 text-sm dark:bg-stone-800/40"><span class="text-stone-500">Saldo awal</span><span class="font-semibold tabular-nums">{money(opening)}</span></li>
			{#each rows as r, i (r.docId + i)}
				<li>
					<svelte:element this={r.path ? 'a' : 'div'} href={r.path ? `${r.path}?id=${r.docId}` : undefined} class="flex items-center gap-3 px-4 py-3 focus-visible:-outline-offset-2">
						<div class="min-w-0 flex-1">
							<p class="truncate font-mono text-xs font-semibold">{r.no}</p>
							<p class="truncate text-xs text-stone-500">{fdate(r.date)}{r.memo ? ' · ' + r.memo : ''}</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold tabular-nums {r.in ? 'text-emerald-600' : 'text-rose-600'}">{r.in ? '+' + money(r.in) : '-' + money(r.out)}</p>
							<p class="text-[11px] text-stone-400 tabular-nums">saldo {money(r.bal)}</p>
						</div>
					</svelte:element>
				</li>
			{:else}
				<li class="py-10 text-center text-sm text-stone-400">Tidak ada transaksi pada periode ini</li>
			{/each}
		</ul>
	</div>
</ReportShell>
