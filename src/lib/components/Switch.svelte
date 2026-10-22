<script lang="ts">
	/** Sakelar on/off. `mixed` = sebagian aktif (untuk sakelar grup). */
	let {
		checked = false,
		mixed = false,
		disabled = false,
		label,
		onchange
	}: { checked?: boolean; mixed?: boolean; disabled?: boolean; label: string; onchange?: (v: boolean) => void } = $props();

	const on = $derived(checked || mixed);
</script>

<button
	type="button"
	role="switch"
	aria-checked={mixed ? 'mixed' : checked}
	aria-label={label}
	{disabled}
	onclick={(e) => (e.stopPropagation(), onchange?.(!checked))}
	class="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 {on
		? mixed
			? 'bg-brand-300 dark:bg-brand-700'
			: 'bg-brand-500'
		: 'bg-stone-200 dark:bg-stone-700'}"
>
	<span
		class="absolute top-0.5 left-0.5 grid size-5 place-items-center rounded-full bg-white shadow transition-transform {on ? 'translate-x-5' : ''}"
	>
		{#if mixed}<span class="h-0.5 w-2 rounded-full bg-brand-400"></span>{/if}
	</span>
</button>
