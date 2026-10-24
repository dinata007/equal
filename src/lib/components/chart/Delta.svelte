<script lang="ts">
	/** Perubahan bertanda vs periode pembanding; warna = arah × apakah naik itu baik. */
	import { ArrowDownRight, ArrowUpRight, Minus } from '@lucide/svelte';
	import { num } from '#lib/util/format.ts';

	let { value, upGood = true, size = 'sm' }: { value: number | null; upGood?: boolean; size?: 'sm' | 'xs' } = $props();
	const good = $derived(value != null && value !== 0 && value > 0 === upGood);
	const flat = $derived(value == null || Math.abs(value) < 0.05);
</script>

<span
	class="inline-flex items-center gap-0.5 font-medium tabular-nums {size === 'xs' ? 'text-[11px]' : 'text-xs'} {flat
		? 'text-stone-400'
		: good
			? 'text-emerald-600 dark:text-emerald-400'
			: 'text-rose-600 dark:text-rose-400'}"
>
	{#if value == null}
		<Minus class="size-3" /> baru
	{:else if flat}
		<Minus class="size-3" /> 0%
	{:else}
		{#if value > 0}<ArrowUpRight class="size-3.5" />{:else}<ArrowDownRight class="size-3.5" />{/if}
		{num(Math.abs(value) >= 100 ? Math.round(Math.abs(value)) : Math.round(Math.abs(value) * 10) / 10)}%
	{/if}
</span>
