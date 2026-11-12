<script lang="ts">
	import { page } from '$app/state';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { api } from '#lib/util/api.ts';
	import { date as fdate, money, monthStart, num, today } from '#lib/util/format.ts';
	import { tableOf } from '#lib/util/export.ts';
	import type { Leaf } from '#lib/domain/menu.ts';
	import Lookup from '#lib/components/ui/Lookup.svelte';
	import { lookups } from '#lib/state/lookups.svelte.ts';
	import PeriodFilter from './PeriodFilter.svelte';
	import ReportShell from './ReportShell.svelte';

	type Product = { id: string; code: string; name: string };
	type Card = {
		ready: boolean;
		item: { id: string; code: string; name: string; unit: string; price: number } | null;
		opening: number;
		rows: { date: string; no: string; label: string; qty: number; bal: number }[];
		totIn: number;
		totOut: number;
		closing: number;
	};
	let { leaf }: { leaf: Leaf } = $props();

	const params = page.url.searchParams;
	let from = $state(params.get('from') ?? monthStart());
	let to = $state(params.get('to') ?? today());
	let storeId = $state(params.get('store') ?? auth.user?.storeId ?? '');
	let itemId = $state(params.get('item') ?? '');
	let search = $state('');
	let matches = $state<Product[]>([]);
	let searching = $state(false);
	let searchError = $state('');
	let card = $state<Card | null>(null);
	let loading = $state(false);
	let error = $state('');
	let requestNo = 0;

	$effect(() => {
		if (!itemId) {
			card = null;
			return;
		}
		const q = new URLSearchParams({ mode: 'card', item: itemId, from, to, store: storeId });
		const current = ++requestNo;
		loading = true;
		error = '';
		api<Card>(`/api/stok/laporan?${q}`)
			.then((result) => {
				if (current === requestNo) {
					card = result;
					if (result.item) search = `${result.item.code} — ${result.item.name}`;
				}
			})
			.catch((e: unknown) => {
				if (current === requestNo) error = e instanceof Error ? e.message : 'Kartu stok gagal dimuat';
			})
			.finally(() => {
				if (current === requestNo) loading = false;
			});
		return () => {
			requestNo++;
		};
	});

	const item = $derived(card?.item);
	const rows = $derived(card?.rows ?? []);
	const location = $derived(storeId ? lookups.label('toko', storeId) : 'Semua Toko');
	const exportTable = $derived(
		item
			? () =>
					tableOf(`Kartu Stok ${item.code} ${from} sd ${to}`, ['Tanggal', 'No', 'Transaksi', 'Masuk', 'Keluar', 'Saldo'], [
						[from, '', 'Saldo awal', '', '', card?.opening ?? 0],
						...rows.map((r) => [r.date, r.no, r.label, Math.max(0, r.qty), Math.max(0, -r.qty), r.bal])
					])
			: undefined
	);

	async function findProducts() {
		if (search.trim().length < 2) {
			searchError = 'Masukkan minimal 2 karakter untuk mencari produk';
			matches = [];
			return;
		}
		searching = true;
		searchError = '';
		try {
			const q = new URLSearchParams({ mode: 'products', q: search.trim() });
			matches = (await api<{ items: Product[] }>(`/api/stok/laporan?${q}`)).items;
			if (!matches.length) searchError = 'Produk tidak ditemukan';
		} catch (e) {
			searchError = e instanceof Error ? e.message : 'Pencarian produk gagal';
		} finally {
			searching = false;
		}
	}

	function chooseProduct(product: Product) {
		itemId = product.id;
		search = `${product.code} — ${product.name}`;
		matches = [];
		searchError = '';
	}
</script>

<ReportShell {leaf} subtitle="{item?.name ?? 'Pilih produk'} · {location} · {fdate(from)} – {fdate(to)}" exportTable={exportTable}>
	{#snippet filters()}
		<div class="min-w-64 flex-1">
			<label class="label" for="stock-product-search">Produk</label>
			<div class="flex gap-2">
				<input id="stock-product-search" class="input min-w-0 flex-1" bind:value={search} placeholder="Kode atau nama produk" onkeydown={(e) => e.key === 'Enter' && findProducts()} />
				<button class="btn btn-secondary" onclick={findProducts} disabled={searching}>{searching ? 'Mencari…' : 'Cari'}</button>
			</div>
			{#if matches.length}
				<div class="mt-1 max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
					{#each matches as product (product.id)}
						<button type="button" class="block w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-800" onclick={() => chooseProduct(product)}>
							<span class="font-mono text-xs">{product.code}</span> <span>{product.name}</span>
						</button>
					{/each}
				</div>
			{/if}
			{#if searchError}<p class="mt-1 text-xs text-rose-600">{searchError}</p>{/if}
		</div>
		<div class="lg:w-56">
			<span class="label">Toko</span>
			<Lookup source="toko" bind:value={storeId} placeholder="Semua toko" clearable />
		</div>
		<PeriodFilter bind:from bind:to />
	{/snippet}

	{#if error}
		<div class="card p-4 text-sm text-rose-600">{error}</div>
	{:else if loading && itemId}
		<div class="card p-8 text-center text-sm text-stone-500">Memuat kartu stok…</div>
	{:else if card && !card.ready}
		<div class="card p-4 text-sm text-stone-500">Saldo awal toko belum tersedia untuk bulan {fdate(from)}.</div>
	{:else if !itemId}
		<div class="card p-8 text-center text-sm text-stone-500">Cari dan pilih produk untuk melihat kartu stok.</div>
	{:else if card}
		<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
			<div class="card p-4"><p class="text-xs text-stone-500">Saldo Awal</p><p class="mt-1 text-xl font-semibold tabular-nums">{num(card.opening)}</p></div>
			<div class="card p-4"><p class="text-xs text-stone-500">Masuk</p><p class="mt-1 text-xl font-semibold text-emerald-600 tabular-nums">+{num(card.totIn)}</p></div>
			<div class="card p-4"><p class="text-xs text-stone-500">Keluar</p><p class="mt-1 text-xl font-semibold text-rose-600 tabular-nums">-{num(card.totOut)}</p></div>
			<div class="card p-4"><p class="text-xs text-stone-500">Saldo Akhir</p><p class="mt-1 text-xl font-semibold tabular-nums">{num(card.closing)} <span class="text-sm font-normal text-stone-400">{item?.unit}</span></p></div>
			<div class="card col-span-2 p-4 lg:col-span-1"><p class="text-xs text-stone-500">Nilai Persediaan</p><p class="mt-1 text-base font-semibold tabular-nums sm:text-xl">Rp {money(card.closing * (item?.price ?? 0))}</p></div>
		</div>

		<div class="card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="table-erp min-w-[700px]">
					<thead>
						<tr><th>Tanggal</th><th>No. Dokumen</th><th>Transaksi</th><th class="text-right">Masuk</th><th class="text-right">Keluar</th><th class="text-right">Saldo</th></tr>
					</thead>
					<tbody>
						<tr class="bg-stone-50/60 dark:bg-stone-800/30">
							<td>{fdate(from)}</td><td colspan="4" class="text-stone-500 italic">Saldo awal</td><td class="num font-semibold">{num(card.opening)}</td>
						</tr>
						{#each rows as row, i (`${row.date}:${row.no}:${i}`)}
							<tr>
								<td>{fdate(row.date)}</td>
								<td class="font-mono text-xs">{row.no}</td>
								<td class="text-stone-500">{row.label}</td>
								<td class="num text-emerald-600">{row.qty > 0 ? num(row.qty) : ''}</td>
								<td class="num text-rose-600">{row.qty < 0 ? num(-row.qty) : ''}</td>
								<td class="num font-medium">{num(row.bal)}</td>
							</tr>
						{:else}
							<tr><td colspan="6" class="py-10 text-center text-stone-400">Tidak ada mutasi pada periode ini</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</ReportShell>
