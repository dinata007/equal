<script lang="ts">
	import { Download, Printer } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { Leaf } from '#lib/erp/menu.ts';
	import PageHeader from '#lib/components/PageHeader.svelte';

	let {
		leaf,
		subtitle,
		filters,
		children,
		onexport
	}: { leaf: Leaf; subtitle?: string; filters?: Snippet; children: Snippet; onexport?: () => void } = $props();
</script>

<PageHeader title={leaf.label} subtitle={subtitle ?? leaf.trail.slice(0, -1).join(' › ')} icon={leaf.icon}>
	{#snippet actions()}
		{#if onexport}<button class="btn btn-secondary" onclick={onexport}><Download class="size-4" /><span class="hidden sm:inline">Export</span></button>{/if}
		<button class="btn btn-secondary" onclick={() => print()}><Printer class="size-4" /><span class="hidden sm:inline">Cetak</span></button>
	{/snippet}
</PageHeader>

{#if filters}
	<div class="card no-print mb-4 grid grid-cols-2 gap-3 p-3 sm:flex sm:flex-wrap sm:items-end">
		{@render filters()}
	</div>
{/if}

<div class="print-area">
	<p class="mb-3 hidden text-lg font-bold print:block">{leaf.label} — {subtitle}</p>
	{@render children()}
</div>
