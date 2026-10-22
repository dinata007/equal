<script lang="ts">
	import DateInput from '#lib/components/DateInput.svelte';
	import PeriodPresets from '#lib/components/PeriodPresets.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Download, Plus, Trash } from '@lucide/svelte';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { addDays, date as fdate, downloadCsv, money, today } from '#lib/erp/format.ts';
	import type { Leaf } from '#lib/erp/menu.ts';
	import type { Doc, DocStatus, TxDef } from '#lib/erp/types.ts';
	import DataTable from '#lib/components/DataTable.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import type { BulkAction, Col } from '#lib/components/types.ts';
	import { ask, toast } from '#lib/erp/ui.svelte.ts';
	import { loadSession, saveSession } from '#lib/components/grid/core.ts';
	import TxForm from './tx/TxForm.svelte';

	let { leaf }: { leaf: Leaf } = $props();

	const def = $derived(leaf.page as TxDef);
	const docId = $derived(page.url.searchParams.get('id'));
	const canCreate = $derived(auth.can(leaf.path, 'create'));
	const canDelete = $derived(auth.can(leaf.path, 'delete'));

	let query = $state('');
	// periode & tab status diingat selama aplikasi terbuka
	// svelte-ignore state_referenced_locally
	const sKey = `senja:page:${auth.user?.id ?? 'anon'}:${leaf.path}`;
	const s0 = loadSession(sKey, { from: addDays(today(), -30), to: today(), status: 'all' as 'all' | DocStatus });
	let from = $state(s0.from);
	let to = $state(s0.to);
	let status = $state<'all' | DocStatus>(s0.status);
	$effect(() => saveSession(sKey, { from, to, status }));

	const all = $derived(db.all<Doc>(def.table));
	const rows = $derived(
		all.filter((d) => d.date >= from && d.date <= to && (status === 'all' || d.status === status))
	);
	const counts = $derived({
		all: all.filter((d) => d.date >= from && d.date <= to).length,
		draft: all.filter((d) => d.date >= from && d.date <= to && d.status === 'draft').length
	});
	const sum = $derived(rows.filter((d) => d.status === 'posted').reduce((s, d) => s + (d.total ?? 0), 0));
	const party = (d: Doc) => (def.party ? db.name(def.party.ref, d[def.party.field]) : (d.memo ?? ''));

	const columns = $derived<Col<Doc>[]>([
		{ key: 'no', label: 'No. Dokumen', cell: noCell },
		{ key: 'date', label: 'Tanggal', format: fdate },
		...(def.party ? [{ key: 'party', label: def.party.label, value: party }] : [{ key: 'memo', label: 'Uraian', value: party }]),
		...(def.source ? [{ key: 'src', label: 'Referensi', value: (d: Doc) => db.get(def.source!.table, d.sourceId)?.no ?? '', class: 'font-mono text-xs text-stone-500' }] : []),
		{ key: 'lines', label: 'Item', align: 'center' as const, value: (d: Doc) => d.lines.length },
		...(def.noAmount ? [] : [{ key: 'total', label: 'Total', align: 'right' as const, value: (d: Doc) => d.total ?? 0, format: money, sum: true }]),
		{ key: 'status', label: 'Status', value: (d: Doc) => statusLabel(d.status), cell: statusCell }
	]);
	const statusLabel = (s: DocStatus) => statuses.find((x) => x.key === s)?.label ?? s;

	const bulk = $derived<BulkAction<Doc>[]>(
		canDelete ? [{ label: 'Hapus draft', icon: Trash, danger: true, when: (d: Doc) => d.status === 'draft', run: removeDrafts }] : []
	);
	async function removeDrafts(ds: Doc[]) {
		if (!(await ask({ title: `Hapus ${ds.length} draft?`, message: ds.slice(0, 5).map((d) => d.no).join(', ') + (ds.length > 5 ? ', …' : ''), danger: true, confirmText: 'Hapus' }))) return false;
		for (const d of ds) await db.remove(def.table, d.id);
		toast.success(`${ds.length} draft dihapus`);
	}

	const statuses: { key: 'all' | DocStatus; label: string }[] = $derived([
		{ key: 'all', label: 'Semua' },
		{ key: 'draft', label: def.statusLabels?.draft ?? 'Draft' },
		{ key: 'posted', label: def.statusLabels?.posted ?? 'Posted' },
		{ key: 'void', label: def.statusLabels?.void ?? 'Batal' }
	]);

	const open = (d: Doc) => goto(`${leaf.path}?id=${d.id}`);

	function exportCsv() {
		downloadCsv(`${leaf.label} ${from} sd ${to}`, ['No', 'Tanggal', def.party?.label ?? 'Uraian', 'Item', 'Total', 'Status'], rows.map((d) => [d.no, d.date, party(d), d.lines.length, d.total ?? 0, d.status]));
	}
</script>

{#snippet noCell(d: Doc)}
	<span class="font-mono text-xs font-semibold text-stone-700 dark:text-stone-300">{d.no}</span>
{/snippet}
{#snippet statusCell(d: Doc)}
	<StatusBadge status={d.status} labels={def.statusLabels} />
{/snippet}
{#snippet card(d: Doc)}
	<div class="flex items-start gap-3">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<span class="truncate font-mono text-xs font-semibold">{d.no}</span>
				<StatusBadge status={d.status} labels={def.statusLabels} />
			</div>
			<p class="mt-0.5 truncate text-sm font-medium">{party(d) || '—'}</p>
			<p class="text-xs text-stone-500">{fdate(d.date)} · {d.lines.length} item</p>
		</div>
		{#if !def.noAmount}<p class="text-sm font-semibold tabular-nums">{money(d.total)}</p>{/if}
	</div>
{/snippet}

{#if docId}
	{#key docId}
		<TxForm {leaf} {docId} />
	{/key}
{:else}
	<PageHeader title={leaf.label} subtitle={leaf.trail.slice(0, -1).join(' › ')} icon={leaf.icon}>
		{#snippet actions()}
			<button class="btn btn-secondary hidden sm:inline-flex" onclick={exportCsv}><Download class="size-4" /> Export</button>
			{#if canCreate}<a href="{leaf.path}?id=new" class="btn btn-primary hidden sm:inline-flex"><Plus class="size-4" /> Buat Baru</a>{/if}
		{/snippet}
	</PageHeader>

	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="card p-4">
			<p class="text-xs text-stone-500">Dokumen</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums">{counts.all}</p>
		</div>
		<div class="card p-4">
			<p class="text-xs text-stone-500">Menunggu ({def.statusLabels?.draft ?? 'Draft'})</p>
			<p class="mt-1 text-2xl font-semibold text-amber-600 tabular-nums">{counts.draft}</p>
		</div>
		{#if !def.noAmount}
			<div class="card col-span-2 p-4">
				<p class="text-xs text-stone-500">Nilai {def.statusLabels?.posted ?? 'Posted'} (filter aktif)</p>
				<p class="mt-1 text-2xl font-semibold tracking-tight tabular-nums">Rp {money(sum)}</p>
			</div>
		{/if}
	</div>

	<div class="card overflow-clip">
		<DataTable {rows} {columns} bind:query {card} {bulk} onrow={open} initialSort={{ key: 'no', dir: -1 }} searchPlaceholder="Cari nomor / pihak…" exportName="{leaf.label} {from} sd {to}" empty="Belum ada dokumen pada periode ini">
			{#snippet toolbar()}
				<div class="flex flex-col gap-2 @3xl:flex-row @3xl:flex-wrap @3xl:items-center">
					<div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2 @3xl:flex">
						<div class="min-w-0 @3xl:w-48"><DateInput bind:value={from} max={to} ariaLabel="Dari tanggal" /></div>
						<span class="text-stone-400">–</span>
						<div class="min-w-0 @3xl:w-48"><DateInput bind:value={to} min={from} ariaLabel="Sampai tanggal" /></div>
						<PeriodPresets bind:from bind:to />
					</div>
					<div class="flex gap-1 self-start overflow-x-auto rounded-xl bg-stone-100 p-1 @3xl:ml-auto @6xl:ml-0 dark:bg-stone-800/60">
						{#each statuses as s (s.key)}
							<button
								class="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition {status === s.key ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500'}"
								onclick={() => (status = s.key)}>{s.label}</button
							>
						{/each}
					</div>
				</div>
			{/snippet}
		</DataTable>
	</div>

	{#if canCreate}
		<a href="{leaf.path}?id=new" class="btn btn-primary fixed right-4 bottom-24 z-20 size-11 rounded-xl p-0 shadow-lg shadow-stone-900/20 sm:hidden" aria-label="Buat baru">
			<Plus class="size-5" />
		</a>
	{/if}
{/if}
