<script lang="ts">
	import { Printer } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { ExportTable } from '#lib/util/export.ts';
	import type { Leaf } from '#lib/domain/menu.ts';
	import ExportMenu from '#lib/components/data/ExportMenu.svelte';
	import PageHeader from '#lib/components/data/PageHeader.svelte';

	let {
		leaf,
		subtitle,
		filters,
		children,
		exportTable
	}: { leaf: Leaf; subtitle?: string; filters?: Snippet; children: Snippet; exportTable?: () => ExportTable } = $props();
</script>

<PageHeader title={leaf.label} subtitle={subtitle ?? leaf.trail.slice(0, -1).join(' › ')} icon={leaf.icon}>
	{#snippet actions()}
		<!-- judul file = nama laporan, subjudul = periode/filter yang sedang tampil -->
		{#if exportTable}<ExportMenu table={() => ({ ...exportTable(), title: leaf.label, subtitle })} />{/if}
		<button class="btn btn-secondary" onclick={() => print()}><Printer class="size-4" /><span class="hidden sm:inline">Cetak</span></button>
	{/snippet}
</PageHeader>

{#if filters}
	<div class="card no-print mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
		{@render filters()}
	</div>
{/if}

<div class="print-area">
	<p class="mb-3 hidden text-lg font-bold print:block">{leaf.label} — {subtitle}</p>
	{@render children()}
</div>
