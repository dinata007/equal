<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	let {
		title,
		subtitle,
		icon: Icon,
		actions
	}: { title: string; subtitle?: string; icon?: Component<any>; actions?: Snippet } = $props();
</script>

<div class="mb-4 flex flex-wrap items-center gap-3 lg:mb-6">
	{#if Icon}
		<span class="hidden size-11 place-items-center rounded-2xl bg-brand-500 text-white sm:grid">
			<Icon class="size-5" />
		</span>
	{/if}
	<div class="min-w-0 flex-1">
		<h1 class="truncate text-xl font-medium lg:text-2xl">{title}</h1>
		{#if subtitle}<p class="truncate text-sm text-stone-500">{subtitle}</p>{/if}
	</div>
	{#if actions}<div class="no-print flex flex-wrap items-center gap-2">{@render actions()}</div>{/if}
</div>
