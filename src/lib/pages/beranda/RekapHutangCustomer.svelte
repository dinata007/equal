<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronRight, RotateCcw } from '@lucide/svelte';
	import Sheet from '#lib/components/ui/Sheet.svelte';
	import type { CustomerDebt, CustomerDebtSummary } from '#lib/server/rekap-hutang-customer.ts';
	import { ApiError, api } from '#lib/util/api.ts';
	import { date, money, num } from '#lib/util/format.ts';

	let data = $state<CustomerDebtSummary | null>(null);
	let detail = $state<CustomerDebt[] | null>(null);
	let open = $state(false);
	let loading = $state(true);
	let detailLoading = $state(false);
	let error = $state('');
	let detailError = $state('');

	async function load() {
		loading = true;
		error = '';
		detail = null;
		detailError = '';
		try {
			data = await api<CustomerDebtSummary>('/api/rekap-hutang-customer');
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Rekap hutang gagal dimuat';
		} finally {
			loading = false;
		}
	}

	async function showDetail() {
		open = true;
		if (detail || detailLoading) return;
		detailLoading = true;
		detailError = '';
		try {
			const result = await api<CustomerDebtSummary>('/api/rekap-hutang-customer?detail=1');
			detail = result.customers;
		} catch (e) {
			detailError = e instanceof ApiError ? e.message : 'Detail hutang gagal dimuat';
		} finally {
			detailLoading = false;
		}
	}

	onMount(() => void load());
</script>

<section class="card mb-4 min-w-0 overflow-hidden">
	<div class="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
		<div>
			<h2 class="font-medium">Rekap Hutang Customer</h2>
			<p class="text-xs text-stone-500">Top 10 berdasarkan sisa hutang terbanyak</p>
		</div>
		<div class="flex items-center gap-2">
			{#if data?.count}
				<button type="button" class="btn btn-ghost btn-sm" onclick={showDetail}>
					Detail <ChevronRight class="size-3.5" />
				</button>
			{/if}
			<button type="button" class="btn btn-ghost btn-icon" onclick={load} disabled={loading} aria-label="Muat ulang rekap hutang">
				<RotateCcw class="size-3.5 {loading ? 'animate-spin' : ''}" />
			</button>
		</div>
	</div>

	{#if loading}
		<p class="px-4 pb-4 text-sm text-stone-500 sm:px-5">Memuat rekap hutang…</p>
	{:else if error}
		<p class="px-4 pb-4 text-sm text-rose-600 dark:text-rose-400 sm:px-5">{error}</p>
	{:else if data}
		<div class="grid grid-cols-3 gap-2 border-y border-stone-100 px-4 py-3 dark:border-stone-800 sm:gap-4 sm:px-5">
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

		<div class="overflow-x-auto">
			<table class="table-erp min-w-[900px]">
				<thead>
					<tr>
						<th>Customer</th>
						<th>Beli</th>
						<th>Bayar</th>
						<th class="text-right">Total pembelian</th>
						<th class="text-right">Total pembayaran</th>
						<th class="text-right">Sisa hutang</th>
					</tr>
				</thead>
				<tbody>
					{#each data.customers as customer (customer.id)}
						<tr>
							<td class="font-medium">{customer.name || customer.id}</td>
							<td class="whitespace-nowrap tabular-nums">{customer.lastPurchaseDate ? date(customer.lastPurchaseDate) : '—'}</td>
							<td class="whitespace-nowrap tabular-nums">{customer.lastPaymentDate ? date(customer.lastPaymentDate) : '—'}</td>
							<td class="num">{money(customer.purchases)}</td>
							<td class="num">{money(customer.payments)}</td>
							<td class="num font-semibold text-rose-600 dark:text-rose-400">{money(customer.balance)}</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="py-6 text-center text-stone-400">Tidak ada customer dengan sisa hutang</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="border-t border-stone-100 px-4 py-2 text-[11px] text-stone-400 dark:border-stone-800 sm:px-5">
			{num(data.count)} customer memiliki sisa hutang
		</p>
	{/if}
</section>

<Sheet bind:open title="Rekap Hutang Customer" subtitle="Semua customer dengan sisa hutang · {num(data?.count ?? 0)} customer" size="xl">
	{#if detailLoading}
		<p class="py-12 text-center text-sm text-stone-500">Memuat semua customer…</p>
	{:else if detailError}
		<div class="py-12 text-center">
			<p class="text-sm text-rose-600 dark:text-rose-400">{detailError}</p>
			<button type="button" class="btn btn-secondary mt-3" onclick={() => { detail = null; void showDetail(); }}>Coba lagi</button>
		</div>
	{:else if detail}
		<div class="overflow-x-auto">
			<table class="table-erp min-w-[900px]">
				<thead>
					<tr>
						<th>Customer</th>
						<th>Beli</th>
						<th>Bayar</th>
						<th class="text-right">Total pembelian</th>
						<th class="text-right">Total pembayaran</th>
						<th class="text-right">Sisa hutang</th>
					</tr>
				</thead>
				<tbody>
					{#each detail as customer (customer.id)}
						<tr>
							<td class="font-medium">{customer.name || customer.id}</td>
							<td class="whitespace-nowrap tabular-nums">{customer.lastPurchaseDate ? date(customer.lastPurchaseDate) : '—'}</td>
							<td class="whitespace-nowrap tabular-nums">{customer.lastPaymentDate ? date(customer.lastPaymentDate) : '—'}</td>
							<td class="num">{money(customer.purchases)}</td>
							<td class="num">{money(customer.payments)}</td>
							<td class="num font-semibold text-rose-600 dark:text-rose-400">{money(customer.balance)}</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="py-10 text-center text-stone-400">Tidak ada customer dengan sisa hutang</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</Sheet>
