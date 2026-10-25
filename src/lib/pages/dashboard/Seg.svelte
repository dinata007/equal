<script lang="ts" generics="K extends string">
	/** Pilihan segmen (mis. Qty | Nilai), gaya sama dengan Dashboard 1. */
	let { options, value = $bindable(), label }: { options: { key: K; label: string }[]; value: K; label: string } = $props();
</script>

<div class="inline-flex shrink-0 rounded-xl bg-stone-100 p-0.5 dark:bg-stone-800" role="group" aria-label={label}>
	{#each options as o (o.key)}
		<button
			type="button"
			class="h-8 rounded-[10px] px-3 text-sm font-medium whitespace-nowrap transition {value === o.key
				? 'bg-white text-stone-900 shadow-xs dark:bg-stone-950 dark:text-stone-100'
				: 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}"
			aria-pressed={value === o.key}
			onclick={() => (value = o.key)}>{o.label}</button
		>
	{/each}
</div>
