<script lang="ts">
	import Select from '#lib/components/Select.svelte';
	import { Search } from '@lucide/svelte';
	import { db } from '#lib/erp/db.svelte.ts';
	import { date as fdate, downloadCsv, money, monthStart, today } from '#lib/erp/format.ts';
	import { journalEntries } from '#lib/erp/ledger.ts';
	import type { Leaf } from '#lib/erp/menu.ts';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	let { leaf }: { leaf: Leaf } = $props();

	let from = $state(monthStart());
	let to = $state(today());
	let source = $state('');
	let query = $state('');

	const coaName = (code: string) => db.all('coa').find((c) => c.code === code)?.name ?? '';
	const all = $derived(journalEntries().filter((e) => e.date >= from && e.date <= to));
	const sources = $derived([...new Set(all.map((e) => e.label))].sort());
	const entries = $derived(
		all.filter((e) => {
			if (source && e.label !== source) return false;
			if (!query) return true;
			const q = query.toLowerCase();
			return e.no.toLowerCase().includes(q) || e.memo.toLowerCase().includes(q) || e.lines.some((l) => l.coa.includes(q) || coaName(l.coa).toLowerCase().includes(q));
		})
	);
	const tot = $derived(entries.reduce((a, e) => { for (const l of e.lines) ((a.d += l.debit), (a.c += l.credit)); return a; }, { d: 0, c: 0 }));

	function exportCsv() {
		downloadCsv(`Jurnal ${from} sd ${to}`, ['Tanggal', 'No', 'Sumber', 'Akun', 'Nama Akun', 'Keterangan', 'Debit', 'Kredit'], entries.flatMap((e) => e.lines.map((l) => [e.date, e.no, e.label, l.coa, coaName(l.coa), l.memo ?? '', l.debit, l.credit])));
	}
</script>

<ReportShell {leaf} subtitle="{fdate(from)} – {fdate(to)} · {entries.length} jurnal" onexport={exportCsv}>
	{#snippet filters()}
		<PeriodFilter bind:from bind:to />
		<div class="col-span-2 sm:w-56">
			<label class="label" for="jr-src">Sumber Transaksi</label>
			<Select id="jr-src" bind:value={source} options={[{ value: '', label: 'Semua sumber' }, ...sources]} label="Sumber Transaksi" />
		</div>
		<div class="relative col-span-2 sm:w-64">
			<label class="label" for="jr-q">Cari</label>
			<Search class="pointer-events-none absolute bottom-2.5 left-3 size-4 text-stone-400" />
			<input id="jr-q" class="input pl-9" placeholder="No / akun / uraian" bind:value={query} type="search" />
		</div>
	{/snippet}

	<div class="mb-4 grid grid-cols-3 gap-3">
		<div class="card p-4"><p class="text-xs text-stone-500">Total Debit</p><p class="mt-1 font-semibold tabular-nums">{money(tot.d)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Total Kredit</p><p class="mt-1 font-semibold tabular-nums">{money(tot.c)}</p></div>
		<div class="card p-4">
			<p class="text-xs text-stone-500">Status</p>
			<p class="mt-1 font-semibold {Math.abs(tot.d - tot.c) < 1 ? 'text-emerald-600' : 'text-rose-600'}">{Math.abs(tot.d - tot.c) < 1 ? 'Seimbang' : 'Selisih ' + money(tot.d - tot.c)}</p>
		</div>
	</div>

	<div class="space-y-3">
		{#each entries.slice(0, 200) as e (e.docId)}
			<div class="card overflow-hidden">
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-stone-100 bg-stone-50/60 px-4 py-2.5 dark:border-stone-800 dark:bg-stone-800/30">
					<a href="{e.path}?id={e.docId}" class="font-mono text-xs font-semibold text-brand-600 hover:underline">{e.no}</a>
					<span class="text-xs text-stone-500">{fdate(e.date)}</span>
					<span class="badge bg-stone-200/70 text-stone-600 dark:bg-stone-700 dark:text-stone-300">{e.label}</span>
					{#if e.memo}<span class="truncate text-xs text-stone-500">{e.memo}</span>{/if}
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<tbody>
							{#each e.lines as l, i (i)}
								<tr class="border-b border-stone-50 last:border-0 dark:border-stone-800/50">
									<td class="w-24 px-4 py-2 font-mono text-xs text-stone-500 {l.credit ? 'pl-10' : ''}">{l.coa}</td>
									<td class="px-2 py-2 {l.credit ? 'pl-8' : ''}">{coaName(l.coa)}<span class="ml-2 hidden text-xs text-stone-400 sm:inline">{l.memo ?? ''}</span></td>
									<td class="num w-32 px-4 py-2">{l.debit ? money(l.debit) : ''}</td>
									<td class="num w-32 px-4 py-2">{l.credit ? money(l.credit) : ''}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div class="card py-16 text-center text-sm text-stone-400">Tidak ada jurnal pada periode ini</div>
		{/each}
		{#if entries.length > 200}<p class="text-center text-xs text-stone-400">Menampilkan 200 dari {entries.length} jurnal. Persempit periode atau gunakan Export.</p>{/if}
	</div>
</ReportShell>
