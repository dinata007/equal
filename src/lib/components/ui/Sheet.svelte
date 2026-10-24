<script lang="ts">
	import { backClose } from '#lib/dom/backClose.svelte.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let {
		open = $bindable(false),
		title,
		subtitle,
		size = 'md',
		children,
		footer,
		onclose
	}: {
		open?: boolean;
		title: string;
		subtitle?: string;
		size?: 'md' | 'lg' | 'xl';
		children: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	} = $props();

	const desktop = matchMedia('(min-width: 640px)').matches;
	const widths = { md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

	function close() {
		open = false;
		onclose?.();
	}
	backClose(() => open, close);
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && close()} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
		<button class="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]" transition:fade={{ duration: 150 }} onclick={close} aria-label="Tutup"></button>
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			class="pb-safe relative flex max-h-[94dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:h-full sm:max-h-none sm:rounded-none sm:rounded-l-3xl dark:bg-stone-900 {widths[size]}"
			transition:fly={desktop ? { x: 480, duration: 220, opacity: 1 } : { y: 600, duration: 240, opacity: 1 }}
		>
			<div class="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-stone-200 sm:hidden dark:bg-stone-700"></div>
			<header class="flex shrink-0 items-start gap-3 px-5 pt-3 pb-3 sm:px-6 sm:pt-5">
				<div class="min-w-0 flex-1">
					<h2 class="truncate text-lg font-medium">{title}</h2>
					{#if subtitle}<p class="truncate text-sm text-stone-500">{subtitle}</p>{/if}
				</div>
				<button class="btn btn-ghost btn-icon -mr-2" onclick={close} aria-label="Tutup" {@attach tooltip()}><X class="size-5" /></button>
			</header>
			<div class="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 sm:px-6">
				{@render children()}
			</div>
			{#if footer}
				<footer class="flex shrink-0 items-center gap-2 border-t border-stone-100 px-5 py-3 sm:px-6 dark:border-stone-800">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}
