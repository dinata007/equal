<script lang="ts">
	import { page } from '$app/state';
	import { ChevronRight } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import type { MenuNode } from '#lib/domain/types.ts';
	import Self from './MenuTree.svelte';

	let { nodes, depth = 0, onnavigate }: { nodes: MenuNode[]; depth?: number; onnavigate?: () => void } = $props();

	const current = $derived(page.url.pathname);
	let open = $state<Record<string, boolean>>({});
	const within = (n: MenuNode) => current === n.path || current.startsWith(n.path + '/');
	const isOpen = (n: MenuNode) => open[n.path!] ?? (depth === 0 ? within(n) : true);
	const toggle = (n: MenuNode) => (open[n.path!] = !isOpen(n));
</script>

<ul class={depth === 0 ? 'space-y-0.5' : depth === 1 ? 'mt-1 mb-2 ml-[18px] border-l border-stone-200 pl-3 dark:border-stone-800' : 'pl-1'}>
	{#each nodes as n (n.path)}
		<li>
			{#if n.children}
				{#if depth === 0}
					<button
						class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition {within(n)
							? 'text-stone-900 dark:text-white'
							: 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800/60'}"
						onclick={() => toggle(n)}
						aria-expanded={isOpen(n)}
					>
						<span
							class="grid size-7 place-items-center rounded-lg transition {within(n)
								? 'bg-brand-500 text-white shadow-sm shadow-stone-900/20'
								: 'bg-stone-100 text-stone-500 group-hover:bg-white dark:bg-stone-800 dark:text-stone-400'}"
						>
							<n.icon class="size-4" />
						</span>
						<span class="flex-1 text-left">{n.label}</span>
						<ChevronRight class="size-4 text-stone-400 transition-transform {isOpen(n) ? 'rotate-90' : ''}" />
					</button>
				{:else}
					<button
						class="flex w-full items-center gap-1 px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-stone-400 uppercase hover:text-stone-600 dark:hover:text-stone-300"
						onclick={() => toggle(n)}
						aria-expanded={isOpen(n)}
					>
						<span class="flex-1 text-left">{n.label}</span>
						<ChevronRight class="size-3 transition-transform {isOpen(n) ? 'rotate-90' : ''}" />
					</button>
				{/if}
				{#if isOpen(n)}
					<div transition:slide={{ duration: 160 }}>
						<Self nodes={n.children} depth={depth + 1} {onnavigate} />
					</div>
				{/if}
			{:else}
				{@const active = current === n.path}
				<a
					href={n.path}
					onclick={onnavigate}
					aria-current={active ? 'page' : undefined}
					class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition {active
						? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
						: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/60 dark:hover:text-stone-100'}"
				>
					{#if n.icon}<n.icon class="size-4 shrink-0 {active ? '' : 'text-stone-400'}" />{/if}
					<span class="truncate">{n.label}</span>
				</a>
			{/if}
		</li>
	{/each}
</ul>
