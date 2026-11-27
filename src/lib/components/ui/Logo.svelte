<script lang="ts">
	/** Logo Equal (tulisan). `onDark` memaksa warna terang (untuk latar gelap). */
	let { compact = false, onDark = false, size = 'md' }: { compact?: boolean; onDark?: boolean; size?: 'md' | 'lg' } = $props();
	const text = $derived(size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-2xl');
</script>

{#if compact}
	<img src="/icon.svg" alt="Equal" class="size-9" />
{:else}
	<span class="inline-flex items-end gap-2">
		<span class="{text} leading-none font-bold tracking-tight {onDark ? 'text-white' : 'text-stone-900 dark:text-white'}">Equal</span>
		{#if size === 'md'}
			<span class="mb-0.5 text-[9px] font-semibold tracking-[.3em] uppercase {onDark ? 'text-stone-400' : 'text-stone-400 dark:text-stone-500'}">ERP</span>
		{/if}
	</span>
{/if}
