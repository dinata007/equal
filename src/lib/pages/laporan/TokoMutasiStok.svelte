<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { api } from '#lib/util/api.ts';
	import { date as fdate, money, monthStart, num, today } from '#lib/util/format.ts';
	import { tableOf } from '#lib/util/export.ts';
	import type { Leaf } from '#lib/domain/menu.ts';
	import DataTable from '#lib/components/data/DataTable.svelte';
	import type { Col } from '#lib/components/data/types.ts';
	import Lookup from '#lib/components/ui/Lookup.svelte';
	import { lookups } from '#lib/state/lookups.svelte.ts';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	type Row = { id: string; code: string; name: string; unit: string; price: number; open: number; in: number; out: number; close: number };
	type Report = { ready: boolean; rows: Row[] };
	let { leaf }: { leaf: Leaf } = $props();

	let from = $state(monthStart());
	let to = $state(today());
	let storeId = $state(auth.user?.storeId ?? '');
	let onlyMoving = $state(false);
	let query = $state('');
	let report = $state<Report | null>(null);
	let loading = $state(false);
	let error = $state('');
	let requestNo = 0;

	$effect(() => {
		const params = new URLSearchParams({ mode: 'mutation', from, to, store: storeId, moving: onlyMoving ? '1' : '0' });
		const current = ++requestNo;
		loading = true;
		error = '';
		api<Report>(`/api/stok/laporan?${params}`)
			.then((result) => {
				if (current === requestNo) report = result;
			})
			.catch((e: unknown) => {
				if (current === requestNo) error = e instanceof Error ? e.message : 'Laporan mutasi stok gagal dimuat';
			})
			.finally(() => {
				if (current === requestNo) loading = false;
			});
		return () => {
			requestNo++;
		};
	});

	const rows = $derived(report?.rows ?? []);
	const total = $derived(rows.reduce((a, r) => ({ open: a.open + r.open, in: a.in + r.in, out: a.out + r.out, close: a.close + r.close, value: a.value + r.close * r.price }), { open: 0, in: 0, out: 0, close: 0, value: 0 }));
	const location = $derived(storeId ? lookups.label('toko', storeId) : 'Semua Toko');
	const cardPath = $derived(leaf.path.replace(/mutasi-stok$/, 'kartu-stok'));
	const columns: Col<Row>[] = [
		{ key: 'code', label: 'Kode', value: (r) => r.code, class: 'font-mono text-xs' },
		{ key: 'name', label: 'Nama', value: (r) => r.name },
		{ key: 'unit', label: 'Sat', value: (r) => r.unit },
		{ key: 'open', label: 'Awal', align: 'right', value: (r) => r.open, format: num, sum: true },
		{ key: 'in', label: 'Masuk', align: 'right', value: (r) => r.in, format: num, sum: true },
		{ key: 'out', label: 'Keluar', align: 'right', value: (r) => r.out, format: num, sum: true },
		{ key: 'close', label: 'Akhir', align: 'right', value: (r) => r.close, format: num, sum: true },
		{ key: 'value', label: 'Nilai', align: 'right', value: (r) => r.close * r.price, format: money, sum: true }
	];
	const openCard = (r: Row) => goto(`${cardPath}?item=${encodeURIComponent(r.id)}&from=${from}&to=${to}${storeId ? '&store=' + encodeURIComponent(storeId) : ''}`);

	function exportData() {
		return tableOf(`Mutasi Stok ${location} ${from} sd ${to}`, ['Kode', 'Nama', 'Satuan', 'Awal', 'Masuk', 'Keluar', 'Akhir', 'Nilai'], rows.map((r) => [r.code, r.name, r.unit, r.open, r.in, r.out, r.close, r.close * r.price]));
	}
</script>

<ReportShell {leaf} subtitle="{location} · {fdate(from)} – {fdate(to)}" exportTable={exportData}>
	{#snippet filters()}
		<PeriodFilter bind:from bind:to />
		<div class="lg:w-56">
			<span class="label">Toko</span>
			<Lookup source="toko" bind:value={storeId} placeholder="Semua toko" clearable />
		</div>
		<label class="flex h-10 items-center gap-2 text-sm lg:h-9">
			<input type="checkbox" class="size-4 accent-brand-600" bind:checked={onlyMoving} /> Hanya item bermutasi
		</label>
	{/snippet}

	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Awal</p><p class="mt-1 text-xl font-semibold tabular-nums">{num(total.open)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Masuk</p><p class="mt-1 text-xl font-semibold text-emerald-600 tabular-nums">+{num(total.in)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Keluar</p><p class="mt-1 text-xl font-semibold text-rose-600 tabular-nums">-{num(total.out)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Saldo Akhir</p><p class="mt-1 text-xl font-semibold tabular-nums">{num(total.close)}</p></div>
		<div class="card p-4"><p class="text-xs text-stone-500">Nilai Persediaan</p><p class="mt-1 text-base font-semibold tabular-nums sm:text-xl">Rp {money(total.value)}</p></div>
	</div>

	{#if error}
		<div class="card p-4 text-sm text-rose-600">{error}</div>
	{:else if report && !report.ready}
		<div class="card p-4 text-sm text-stone-500">Saldo awal toko belum tersedia untuk bulan {fdate(from)}.</div>
	{:else if loading && !report}
		<div class="card p-8 text-center text-sm text-stone-500">Memuat mutasi stok…</div>
	{:else}
		<div class="card overflow-clip">
			<DataTable rows={rows} {columns} bind:query rowKey={(r) => r.id} searchPlaceholder="Cari produk…" exportName="Mutasi Stok {location} {from} sd {to}" onrow={openCard} />
		</div>
		<p class="no-print mt-2 text-xs text-stone-400">Klik baris untuk membuka kartu stok. Nilai persediaan dihitung dari jumlah stok × harga jual master.</p>
	{/if}
</ReportShell>
