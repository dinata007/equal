<script lang="ts">
	import { page } from '$app/state';
	import { ShieldAlert } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { findNode, isLeaf } from '#lib/erp/menu.ts';
	import MasterPage from '#lib/pages/MasterPage.svelte';
	import TransactionPage from '#lib/pages/TransactionPage.svelte';
	import ModuleOverview from '#lib/pages/ModuleOverview.svelte';
	import StockMutation from '#lib/pages/reports/StockMutation.svelte';
	import StockCard from '#lib/pages/reports/StockCard.svelte';
	import SalesAnalysis from '#lib/pages/reports/SalesAnalysis.svelte';
	import PartyMutation from '#lib/pages/reports/PartyMutation.svelte';
	import PartyCard from '#lib/pages/reports/PartyCard.svelte';
	import CashBook from '#lib/pages/reports/CashBook.svelte';
	import JournalReport from '#lib/pages/reports/JournalReport.svelte';
	import AttendanceReport from '#lib/pages/reports/AttendanceReport.svelte';
	import Closing from '#lib/pages/custom/Closing.svelte';
	import Users from '#lib/pages/custom/Users.svelte';
	import Products from '#lib/pages/custom/Products.svelte';
	import ProductAttributes from '#lib/pages/custom/ProductAttributes.svelte';

	const components: Record<string, Component<any>> = {
		'stock-mutation': StockMutation,
		'stock-card': StockCard,
		'sales-analysis': SalesAnalysis,
		'party-mutation': PartyMutation,
		'party-card': PartyCard,
		'cash-book': CashBook,
		'journal-report': JournalReport,
		'attendance-report': AttendanceReport,
		closing: Closing,
		users: Users,
		products: Products,
		'product-attributes': ProductAttributes
	};

	const node = $derived(findNode('/' + page.params.path));
</script>

<svelte:head><title>{node?.label ?? 'Tidak ditemukan'} · ruangSenja</title></svelte:head>

{#if !node}
	<div class="grid place-items-center py-24 text-center">
		<p class="text-6xl font-bold text-stone-200 dark:text-stone-800">404</p>
		<p class="mt-2 text-stone-500">Halaman tidak ditemukan</p>
		<a href="/" class="btn btn-secondary mt-6">Ke Dashboard</a>
	</div>
{:else if isLeaf(node)}
	{#if !auth.can(node.path)}
		<div class="grid place-items-center py-24 text-center">
			<ShieldAlert class="size-14 stroke-1 text-stone-300" />
			<p class="mt-3 font-medium">Akses ditolak</p>
			<p class="mt-1 text-sm text-stone-500">Akun Anda belum diberi akses ke menu <b>{node.label}</b>. Hubungi administrator.</p>
			<a href="/" class="btn btn-secondary mt-6">Ke Dashboard</a>
		</div>
	{:else}
		{#key node.path}
			{#if node.page.kind === 'master'}
				<MasterPage leaf={node} />
			{:else if node.page.kind === 'transaction'}
				<TransactionPage leaf={node} />
			{:else}
				{@const Comp = components[node.page.component]}
				<Comp leaf={node} {...node.page.props} />
			{/if}
		{/key}
	{/if}
{:else}
	{#key node.path}<ModuleOverview {node} />{/key}
{/if}
