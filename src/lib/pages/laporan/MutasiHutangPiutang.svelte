<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '#lib/dev-data/db.svelte.ts';
	import { date as fdate, money, monthStart, today } from '#lib/util/format.ts';
	import { tableOf } from '#lib/util/export.ts';
	import { partyMoves } from '#lib/domain/ledger.ts';
	import type { Leaf } from '#lib/domain/menu.ts';
	import DataTable from '#lib/components/data/DataTable.svelte';
	import type { Col } from '#lib/components/data/types.ts';
	import { loadSession, saveSession } from '#lib/components/data/grid/core.ts';
	import { auth } from '#lib/state/auth.svelte.ts';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	let { leaf, kind }: { leaf: Leaf; kind: 'ar' | 'ap' } = $props();

	// filter laporan diingat selama aplikasi terbuka
	// svelte-ignore state_referenced_locally
	const sKey = `senja:page:${auth.user?.id ?? 'anon'}:${leaf.path}`;
	const s0 = loadSession(sKey, { from: monthStart(), to: today(), hideZero: true });
	let from = $state(s0.from);
	let to = $state(s0.to);
	let hideZero = $state(s0.hideZero);
	$effect(() => saveSession(sKey, { from, to, hideZero }));

	const table = $derived(kind === 'ar' ? 'customers' : 'suppliers');
	const noun = $derived(kind === 'ar' ? 'Piutang' : 'Hutang');
	const data = $derived.by(() => {
		const map = new Map<string, { open: number; inc: number; dec: number }>();
		for (const m of partyMoves(kind)) {
			if (m.date > to) continue;
			const r = map.get(m.partyId) ?? { open: 0, inc: 0, dec: 0 };
			if (m.date < from) r.open += m.inc - m.dec;
			else ((r.inc += m.inc), (r.dec += m.dec));
			map.set(m.partyId, r);
		}
		return db
			.all(table)
			.map((p) => {
				const r = map.get(p.id) ?? { open: 0, inc: 0, dec: 0 };
				return { id: p.id, party: p, ...r, close: r.open + r.inc - r.dec };
			})
			.filter((r) => !hideZero || r.open || r.inc || r.dec);
	});
	type R = (typeof data)[number];
	const tot = $derived(data.reduce((a, r) => ({ open: a.open + r.open, inc: a.inc + r.inc, dec: a.dec + r.dec, close: a.close + r.close }), { open: 0, inc: 0, dec: 0, close: 0 }));

	const columns = $derived<Col<R>[]>([
		{ key: 'code', label: 'Kode', value: (r) => r.party.code, class: 'font-mono text-xs' },
		{ key: 'name', label: kind === 'ar' ? 'Customer' : 'Supplier', value: (r) => r.party.name },
		{ key: 'open', label: 'Saldo Awal', align: 'right', value: (r) => r.open, format: money, sum: true },
		{ key: 'inc', label: kind === 'ar' ? 'Debit (+)' : 'Kredit (+)', align: 'right', value: (r) => r.inc, format: money, sum: true },
		{ key: 'dec', label: kind === 'ar' ? 'Kredit (−)' : 'Debit (−)', align: 'right', value: (r) => r.dec, format: money, sum: true },
		{ key: 'close', label: 'Saldo Akhir', align: 'right', value: (r) => r.close, cell: closeCell, format: money, sum: true }
	]);
	const cardPath = $derived(leaf.path.replace(/mutasi-(piutang|hutang)$/, (_, x) => 'kartu-' + x));
	const open = (r: R) => goto(`${cardPath}?party=${r.id}&from=${from}&to=${to}`);

	function exportData() {
		return tableOf(`Mutasi ${noun} ${from} sd ${to}`, ['Kode', 'Nama', 'Saldo Awal', 'Tambah', 'Kurang', 'Saldo Akhir'], data.map((r) => [r.party.code, r.party.name, r.open, r.inc, r.dec, r.close]));
	}
</script>

{#snippet closeCell(r: R)}<span class="font-semibold">{money(r.close)}</span>{/snippet}
{#snippet card(r: R)}
	<div class="flex items-center gap-3">
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{r.party.name}</p>
			<p class="truncate text-xs text-stone-500">Awal {money(r.open)} · +{money(r.inc)} · −{money(r.dec)}</p>
		</div>
		<p class="text-sm font-semibold tabular-nums">{money(r.close)}</p>
	</div>
{/snippet}

<ReportShell {leaf} subtitle="{fdate(from)} – {fdate(to)}" exportTable={exportData}>
	{#snippet filters()}
		<PeriodFilter bind:from bind:to />
		<label class="flex h-10 items-center gap-2 text-sm lg:h-9">
			<input type="checkbox" class="size-4 accent-brand-600" bind:checked={hideZero} /> Sembunyikan saldo nol
		</label>
	{/snippet}

	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Awal</p><p class="mt-1 text-lg font-semibold tabular-nums">Rp {money(tot.open)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Penambahan</p><p class="mt-1 text-lg font-semibold tabular-nums">Rp {money(tot.inc)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Pengurangan</p><p class="mt-1 text-lg font-semibold tabular-nums">Rp {money(tot.dec)}</p></div>
		<div class="card bg-stone-900 dark:bg-brand-900 p-4 text-white"><p class="text-xs text-white/80">Saldo {noun}</p><p class="mt-1 text-lg font-semibold tabular-nums">Rp {money(tot.close)}</p></div>
	</div>
	<div class="card overflow-clip">
		<DataTable rows={data} {columns} {card} onrow={open} searchPlaceholder="Cari kode / nama…" exportName="Mutasi {noun} {from} sd {to}" empty="Tidak ada saldo pada periode ini" />
	</div>
</ReportShell>
