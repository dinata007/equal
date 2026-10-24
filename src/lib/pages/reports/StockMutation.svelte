<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '#lib/erp/db.svelte.ts';
	import { date as fdate, money, monthStart, num, today } from '#lib/erp/format.ts';
	import { tableOf } from '#lib/erp/export.ts';
	import { locMatch, stockMutation } from '#lib/erp/ledger.ts';
	import type { Leaf } from '#lib/erp/menu.ts';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import DataTable from '#lib/components/DataTable.svelte';
	import Lookup from '#lib/components/Lookup.svelte';
	import type { Col } from '#lib/components/types.ts';
	import { loadSession, saveSession } from '#lib/components/grid/core.ts';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	let { leaf, itemTable, scope }: { leaf: Leaf; itemTable: string; scope: string } = $props();

	// filter laporan diingat selama aplikasi terbuka
	// svelte-ignore state_referenced_locally
	const sKey = `senja:page:${auth.user?.id ?? 'anon'}:${leaf.path}`;
	// svelte-ignore state_referenced_locally
	const s0 = loadSession(sKey, { from: monthStart(), to: today(), storeId: scope === 'TOKO' ? (auth.user?.storeId ?? '') : '', onlyMoving: false });
	let from = $state(s0.from);
	let to = $state(s0.to);
	let storeId = $state(s0.storeId);
	let query = $state('');
	let onlyMoving = $state(s0.onlyMoving);
	$effect(() => saveSession(sKey, { from, to, storeId, onlyMoving }));

	const priceKey = $derived(itemTable === 'products' ? 'buyPrice' : 'price');
	const data = $derived(
		stockMutation(itemTable, locMatch(scope, storeId), from, to).filter((r) => !onlyMoving || r.open || r.in || r.out)
	);
	type R = (typeof data)[number];
	const tot = $derived(
		data.reduce(
			(a, r) => ({ open: a.open + r.open, in: a.in + r.in, out: a.out + r.out, close: a.close + r.close, value: a.value + r.close * (r.item[priceKey] ?? 0) }),
			{ open: 0, in: 0, out: 0, close: 0, value: 0 }
		)
	);
	const location = $derived(scope === 'MAT' ? 'Gudang Material' : scope === 'INV' ? 'Gudang Inventory' : storeId ? db.name('stores', storeId) : 'Semua Toko');

	const columns: Col<R>[] = [
		{ key: 'code', label: 'Kode', value: (r) => r.item.code, class: 'font-mono text-xs' },
		{ key: 'name', label: 'Nama', value: (r) => r.item.name },
		{ key: 'unit', label: 'Sat', value: (r) => r.item.unit },
		{ key: 'open', label: 'Awal', align: 'right', value: (r) => r.open, format: num, sum: true },
		{ key: 'in', label: 'Masuk', align: 'right', value: (r) => r.in, cell: inCell, sum: true },
		{ key: 'out', label: 'Keluar', align: 'right', value: (r) => r.out, cell: outCell, sum: true },
		{ key: 'close', label: 'Akhir', align: 'right', value: (r) => r.close, cell: closeCell, sum: true },
		{ key: 'value', label: 'Nilai', align: 'right', value: (r) => r.close * (r.item[priceKey] ?? 0), format: money, sum: true }
	];

	const cardPath = $derived(leaf.path.replace(/mutasi-stok$/, 'kartu-stok'));
	const openCard = (r: R) => goto(`${cardPath}?item=${r.item.id}&from=${from}&to=${to}${storeId ? '&store=' + storeId : ''}`);

	function exportData() {
		return tableOf(`Mutasi Stok ${location} ${from} sd ${to}`, ['Kode', 'Nama', 'Satuan', 'Awal', 'Masuk', 'Keluar', 'Akhir', 'Nilai'], data.map((r) => [r.item.code, r.item.name, r.item.unit, r.open, r.in, r.out, r.close, r.close * (r.item[priceKey] ?? 0)]));
	}
</script>

{#snippet inCell(r: R)}<span class={r.in ? 'text-emerald-600' : 'text-stone-300 dark:text-stone-600'}>{num(r.in)}</span>{/snippet}
{#snippet outCell(r: R)}<span class={r.out ? 'text-rose-600' : 'text-stone-300 dark:text-stone-600'}>{num(r.out)}</span>{/snippet}
{#snippet closeCell(r: R)}
	<span class="font-semibold {r.close <= (r.item.minStock ?? 0) ? 'text-amber-600' : ''}">{num(r.close)}</span>
{/snippet}
{#snippet card(r: R)}
	<div class="flex items-center gap-3">
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{r.item.name}</p>
			<p class="text-xs text-stone-500">
				Awal {num(r.open)} · <span class="text-emerald-600">+{num(r.in)}</span> · <span class="text-rose-600">-{num(r.out)}</span>
			</p>
		</div>
		<div class="text-right">
			<p class="text-lg font-semibold tabular-nums {r.close <= (r.item.minStock ?? 0) ? 'text-amber-600' : ''}">{num(r.close)}</p>
			<p class="text-[11px] text-stone-400">{r.item.unit}</p>
		</div>
	</div>
{/snippet}

<ReportShell {leaf} subtitle="{location} · {fdate(from)} – {fdate(to)}" exportTable={exportData}>
	{#snippet filters()}
		<PeriodFilter bind:from bind:to />
		{#if scope === 'TOKO'}
			<div class="lg:w-56">
				<span class="label">Toko</span>
				<Lookup table="stores" bind:value={storeId} placeholder="Semua toko" clearable />
			</div>
		{/if}
		<label class="flex h-10 items-center gap-2 text-sm lg:h-9">
			<input type="checkbox" class="size-4 accent-brand-600" bind:checked={onlyMoving} /> Hanya item bermutasi
		</label>
	{/snippet}

	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Awal</p><p class="mt-1 text-xl font-semibold tabular-nums">{num(tot.open)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Masuk</p><p class="mt-1 text-xl font-semibold text-emerald-600 tabular-nums">+{num(tot.in)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Keluar</p><p class="mt-1 text-xl font-semibold text-rose-600 tabular-nums">-{num(tot.out)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Nilai Persediaan</p><p class="mt-1 text-base font-semibold tabular-nums sm:text-xl">Rp {money(tot.value)}</p></div>
	</div>

	<div class="card overflow-clip">
		<DataTable rows={data} {columns} bind:query {card} rowKey={(r) => r.item.id} searchPlaceholder="Cari item…" exportName="Mutasi Stok {location} {from} sd {to}" onrow={openCard} />
	</div>
	<p class="no-print mt-2 text-xs text-stone-400">Klik baris untuk membuka kartu stok. Angka akhir berwarna kuning = di bawah stok minimum.</p>
</ReportShell>
