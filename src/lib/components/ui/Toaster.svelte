<script lang="ts">
	import { tooltip } from '#lib/dom/tooltip.ts';
	import { CircleCheck, CircleX, Info, X } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import { toast } from '#lib/state/ui.svelte.ts';

	const icons = { success: CircleCheck, error: CircleX, info: Info };
	const tone = {
		success: 'text-emerald-500',
		error: 'text-rose-500',
		info: 'text-sky-500'
	};
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end"
	aria-live="polite"
>
	{#each toast.items as t (t.id)}
		{@const Icon = icons[t.kind]}
		<div
			transition:fly={{ y: 16, duration: 200 }}
			class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-stone-200 bg-white/95 p-3 pr-2 text-sm shadow-lg backdrop-blur dark:border-stone-700 dark:bg-stone-900/95"
		>
			<Icon class="mt-0.5 size-5 shrink-0 {tone[t.kind]}" />
			<p class="flex-1 leading-snug">{t.message}</p>
			<button class="btn btn-ghost btn-sm btn-icon !size-7" onclick={() => toast.dismiss(t.id)} aria-label="Tutup" {@attach tooltip()}>
				<X class="size-4" />
			</button>
		</div>
	{/each}
</div>
