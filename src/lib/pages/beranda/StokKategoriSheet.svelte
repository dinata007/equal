<script lang="ts">
	import Sheet from '#lib/components/ui/Sheet.svelte';
	import { date as fdate, money, num, short } from '#lib/util/format.ts';
	import type { Stock } from './stok.ts';

	let {
		open = $bindable(false),
		stock,
		date
	}: {
		open?: boolean;
		stock: Stock;
		date: string;
	} = $props();

	const maxValue = $derived(Math.max(1, ...stock.categories.map((category) => category.nilai)));
</script>

<Sheet bind:open title="Stok Toko per Kategori" subtitle={fdate(date)} size="lg">
	<div class="mb-4 rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/50">
		<p class="text-xs text-stone-500">Total stok toko</p>
		<div class="mt-2 grid grid-cols-2 gap-3">
			<div>
				<p class="text-[11px] text-stone-400">Jumlah stok</p>
				<p class="text-xl font-semibold tabular-nums">{num(stock.level(date)?.qty ?? 0)} pcs</p>
			</div>
			<div>
				<p class="text-[11px] text-stone-400">Nilai persediaan</p>
				<p class="text-xl font-semibold tabular-nums" title={money(stock.level(date)?.nilai ?? 0)}>{short(stock.level(date)?.nilai ?? 0)}</p>
			</div>
		</div>
	</div>

	<div class="mb-2 flex items-center justify-between gap-3">
		<h3 class="text-sm font-medium">{stock.categories.length} kategori</h3>
		<span class="text-xs text-stone-500">Diurutkan menurut nilai stok</span>
	</div>

	<ul class="divide-y divide-stone-100 dark:divide-stone-800">
		{#each stock.categories as category (category.id)}
			<li class="py-3">
				<div class="flex items-baseline justify-between gap-3">
					<span class="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
					<span class="shrink-0 text-sm font-semibold tabular-nums" title={money(category.nilai)}>{short(category.nilai)}</span>
				</div>
				<div class="mt-2 flex items-center gap-3">
					<div class="h-1.5 flex-1 rounded-full bg-stone-100 dark:bg-stone-800">
						<div class="h-1.5 rounded-full bg-brand-500" style="width:{Math.max(0, (category.nilai / maxValue) * 100)}%"></div>
					</div>
					<span class="w-24 shrink-0 text-right text-xs text-stone-500 tabular-nums">{num(category.qty)} pcs</span>
				</div>
			</li>
		{:else}
			<li class="py-10 text-center text-sm text-stone-400">Belum ada rincian stok pada periode ini</li>
		{/each}
	</ul>
</Sheet>
