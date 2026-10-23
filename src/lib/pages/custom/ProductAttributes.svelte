<script lang="ts">
	/** Atribut produk (tabel lama): satu menu bertab, seperti tombol Brand/Gender/… di window produk PowerBuilder. */
	import * as M from '#lib/erp/defs/masters.ts';
	import type { Leaf } from '#lib/erp/menu.ts';
	import type { MasterDef } from '#lib/erp/types.ts';
	import { loadSession, saveSession } from '#lib/components/grid/core.ts';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import MasterPage from '#lib/pages/MasterPage.svelte';

	let { leaf }: { leaf: Leaf } = $props();

	const TABS: { key: string; label: string; def: MasterDef }[] = [
		{ key: 'brand', label: 'Brand', def: M.productBrand },
		{ key: 'gender', label: 'Gender', def: M.productGender },
		{ key: 'grup-dept', label: 'Grup Dept', def: M.productDeptGroup },
		{ key: 'dept', label: 'Department', def: M.productDept },
		{ key: 'bahan', label: 'Bahan', def: M.productMaterial },
		{ key: 'warna', label: 'Warna', def: M.productColor },
		{ key: 'size', label: 'Size', def: M.productSize },
		{ key: 'aplikasi', label: 'Aplikasi', def: M.productApplication },
		{ key: 'jenis', label: 'Jenis', def: M.productKind },
		{ key: 'tipe', label: 'Tipe', def: M.productType }
	];

	// tab terakhir diingat selama aplikasi terbuka
	// svelte-ignore state_referenced_locally
	const sKey = `senja:page:${auth.user?.id ?? 'anon'}:${leaf.path}`;
	let tab = $state(loadSession(sKey, { tab: 'brand' }).tab);
	$effect(() => saveSession(sKey, { tab }));
	const cur = $derived(TABS.find((t) => t.key === tab) ?? TABS[0]);
</script>

{#snippet nav()}
	<div class="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 dark:bg-stone-800/60" role="tablist" aria-label="Jenis atribut">
		{#each TABS as t (t.key)}
			<button
				role="tab"
				aria-selected={t.key === cur.key}
				class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition {t.key === cur.key ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}"
				onclick={() => (tab = t.key)}>{t.label}</button
			>
		{/each}
	</div>
{/snippet}

{#key cur.key}
	<MasterPage {leaf} page={cur.def} label={cur.label} {nav} />
{/key}
