<script lang="ts">
	/** Logo Senja. `onDark` memaksa varian terang (untuk latar gelap). */
	let { compact = false, onDark = false, size = 'md' }: { compact?: boolean; onDark?: boolean; size?: 'md' | 'lg' } = $props();
	const h = $derived(size === 'lg' ? 'h-12 sm:h-16' : 'h-7');
</script>

{#if compact}
	<img src="/icon.svg" alt="Senja" class="size-9" />
{:else}
	<span class="inline-flex items-end gap-2">
		<img src="/logo-light.png" alt="Senja" class="{h} w-auto {onDark ? 'hidden' : 'dark:hidden'}" />
		<img src="/logo-dark.png" alt="Senja" class="{h} w-auto {onDark ? '' : 'hidden dark:block'}" />
		{#if size === 'md'}
			<span class="mb-1 text-[9px] font-semibold tracking-[.3em] uppercase {onDark ? 'text-stone-400' : 'text-stone-400 dark:text-stone-500'}">ERP</span>
		{/if}
	</span>
{/if}
