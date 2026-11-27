<script lang="ts">
	import { onMount } from 'svelte';
	import { RotateCcw } from '@lucide/svelte';
	import DataTable from '#lib/components/data/DataTable.svelte';
	import type { Col } from '#lib/components/data/types.ts';
	import type { CustomerDebt, CustomerDebtSummary } from '#lib/server/rekap-hutang-customer.ts';
	import { ApiError, api } from '#lib/util/api.ts';
	import { date, money, num } from '#lib/util/format.ts';

	let data = $state<CustomerDebtSummary | null>(null);
	let loading = $state(true);
	let error = $state('');

	async function load() {
		loading = true;
		error = '';
		try {
			data = await api<CustomerDebtSummary>('/api/rekap-hutang-customer?detail=1');
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Rekap hutang gagal dimuat';
		} finally {
			loading = false;
		}
	}

	const fdate = (v: string | null) => (v ? date(v) : '—');

	const columns: Col<CustomerDebt>[] = [
		{ key: 'name', label: 'Customer', value: (r) => r.name || r.id, class: 'font-medium' },
		{ key: 'lastPurchaseDate', label: 'Beli Terakhir', value: (r) => r.lastPurchaseDate ?? '', format: fdate, filter: 'date' },
		{ key: 'lastPaymentDate', label: 'Bayar Terakhir', value: (r) => r.lastPaymentDate ?? '', format: fdate, filter: 'date' },
		{ key: 'purchases', label: 'Total Pembelian', align: 'right', value: (r) => r.purchases, format: money, sum: true },
		{ key: 'payments', label: 'Total Pembayaran', align: 'right', value: (r) => r.payments, format: money, sum: true },
		{ key: 'balance', label: 'Sisa Hutang', align: 'right', value: (r) => r.balance, format: money, sum: true, cell: balanceCell }
	];

	onMount(() => void load());
</script>

{#snippet balanceCell(r: CustomerDebt)}<span class="font-semibold text-rose-600 dark:text-rose-400">{money(r.balance)}</span>{/snippet}
{#snippet card(r: CustomerDebt)}
	<div class="flex items-center gap-3">
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{r.name || r.id}</p>
			<p class="truncate text-xs text-stone-500">Beli {fdate(r.lastPurchaseDate)} · Bayar {fdate(r.lastPaymentDate)}</p>
		</div>
		<p class="text-sm font-semibold text-rose-600 tabular-nums dark:text-rose-400">{money(r.balance)}</p>
	</div>
{/snippet}

<section class="card mb-4 min-w-0 overflow-clip">
	<div class="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
		<div>
			<h2 class="font-medium">Rekap Hutang Customer</h2>
			<p class="text-xs text-stone-500">
				{data ? `${num(data.count)} customer memiliki sisa hutang` : 'Customer dengan sisa hutang'}
			</p>
		</div>
		<button type="button" class="btn btn-ghost btn-icon" onclick={load} disabled={loading} aria-label="Muat ulang rekap hutang">
			<RotateCcw class="size-3.5 {loading ? 'animate-spin' : ''}" />
		</button>
	</div>

	{#if loading && !data}
		<p class="px-4 pb-4 text-sm text-stone-500 sm:px-5">Memuat rekap hutang…</p>
	{:else if error}
		<p class="px-4 pb-4 text-sm text-rose-600 dark:text-rose-400 sm:px-5">{error}</p>
	{:else if data}
		<div class="grid grid-cols-3 gap-2 border-t border-stone-100 px-4 py-3 dark:border-stone-800 sm:gap-4 sm:px-5">
			<div class="min-w-0">
				<p class="truncate text-[11px] text-stone-500">Total pembelian</p>
				<p class="truncate text-sm font-semibold tabular-nums sm:text-base" title={money(data.totals.purchases)}>{money(data.totals.purchases)}</p>
			</div>
			<div class="min-w-0">
				<p class="truncate text-[11px] text-stone-500">Total pembayaran</p>
				<p class="truncate text-sm font-semibold tabular-nums sm:text-base" title={money(data.totals.payments)}>{money(data.totals.payments)}</p>
			</div>
			<div class="min-w-0">
				<p class="truncate text-[11px] text-stone-500">Sisa hutang</p>
				<p class="truncate text-sm font-semibold tabular-nums text-rose-600 sm:text-base dark:text-rose-400" title={money(data.totals.balance)}>{money(data.totals.balance)}</p>
			</div>
		</div>

		<div class="border-t border-stone-100 dark:border-stone-800">
			<DataTable
				rows={data.customers}
				{columns}
				{card}
				id="beranda:rekap-hutang-customer"
				rowKey={(r) => r.id}
				selectable={false}
				initialSort={{ key: 'balance', dir: -1 }}
				searchPlaceholder="Cari customer…"
				exportName="Rekap Hutang Customer"
				empty="Tidak ada customer dengan sisa hutang"
				maxHeight="28rem"
			/>
		</div>
	{/if}
</section>
