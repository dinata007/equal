<script lang="ts">
	/**
	 * Grup Dept & Department dalam satu tab master-detail, seperti window w_m_dept PowerBuilder:
	 * pilih grup (master) → department grup itu (detail); department baru otomatis masuk grup terpilih.
	 */
	import type { Snippet } from 'svelte';
	import { productDept, productDeptGroup } from '#lib/domain/defs/masters.ts';
	import type { Leaf } from '#lib/domain/menu.ts';
	import type { Row } from '#lib/domain/types.ts';
	import PageHeader from '#lib/components/data/PageHeader.svelte';
	import MasterPage from '#lib/pages/master/MasterPage.svelte';
	import { lookups } from '#lib/state/lookups.svelte.ts';

	let { leaf, nav }: { leaf: Leaf; nav?: Snippet } = $props();

	let grup = $state<string>();
	const grupLabel = $derived(grup ? lookups.label('produk-grup-dept', grup) : '');
</script>

<PageHeader title={leaf.label} subtitle={leaf.trail.slice(0, -1).join(' › ')} icon={leaf.icon} />
{#if nav}{@render nav()}{/if}

<!-- berdampingan mulai xl; lebar 6:5 = perbandingan lebar kolom kedua tabel -->
<div class="grid items-start gap-3 xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
	<MasterPage {leaf} page={productDeptGroup} label="Grup Dept" embed={{ title: 'Grup Dept' }} selected={grup} onselect={(r: Row) => (grup = r.grup_dept)} />
	<MasterPage
		{leaf}
		page={productDept}
		label="Department"
		embed={{ title: 'Department', note: grup ? `Grup ${grupLabel}` : undefined, empty: 'Pilih grup dulu' }}
		filter={(r: Row) => r.grup_dept === grup}
		preset={{ grup_dept: grup }}
	/>
</div>
