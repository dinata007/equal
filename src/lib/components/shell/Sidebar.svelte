<script lang="ts">
	import { tooltip } from '#lib/dom/tooltip.ts';
	import { page } from '$app/state';
	import { ChevronsLeft, ChevronsRight, LayoutDashboard, Search } from '@lucide/svelte';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { MENU, visibleTree } from '#lib/domain/menu.ts';
	import { shell } from '#lib/state/ui.svelte.ts';
	import Avatar from '../ui/Avatar.svelte';
	import Logo from '../ui/Logo.svelte';
	import MenuTree from './MenuTree.svelte';

	let { collapsed = false, onnavigate }: { collapsed?: boolean; onnavigate?: () => void } = $props();

	const tree = $derived(visibleTree(MENU, (p) => auth.can(p)));
	const path = $derived(page.url.pathname);
</script>

<div class="flex h-full flex-col">
	<div class="flex h-16 shrink-0 items-center justify-between px-4 {collapsed ? 'justify-center px-0' : ''}">
		<a href="/" onclick={onnavigate}><Logo compact={collapsed} /></a>
		{#if !collapsed && !onnavigate}
			<button class="btn btn-ghost btn-icon btn-sm" onclick={() => shell.toggleCollapsed()} aria-label="Ciutkan sidebar" {@attach tooltip()}>
				<ChevronsLeft class="size-4" />
			</button>
		{/if}
	</div>

	{#if collapsed}
		<nav class="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-2">
			<button aria-label="Lebarkan sidebar" {@attach tooltip('Lebarkan sidebar', { placement: 'right' })} class="grid size-10 place-items-center rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800" onclick={() => shell.toggleCollapsed()}>
				<ChevronsRight class="size-5" />
			</button>
			<a href="/" aria-label="Dashboard" {@attach tooltip("Dashboard", { placement: 'right' })} class="grid size-10 place-items-center rounded-xl {path === '/' ? 'bg-brand-500 text-white' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}">
				<LayoutDashboard class="size-5" />
			</a>
			<button aria-label="Cari menu" {@attach tooltip('Cari menu', { placement: 'right', kbd: 'Ctrl K' })} class="grid size-10 place-items-center rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800" onclick={() => (shell.palette = true)}>
				<Search class="size-5" />
			</button>
			<div class="my-2 h-px w-8 bg-stone-200 dark:bg-stone-800"></div>
			{#each tree as m (m.path)}
				{@const active = path.startsWith(m.path + '/') || path === m.path}
				<a href={m.path} aria-label={m.label} {@attach tooltip(m.label, { placement: 'right' })} class="grid size-10 place-items-center rounded-xl transition {active ? 'bg-brand-500 text-white shadow-sm shadow-stone-900/20' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}">
					{#if m.icon}<m.icon class="size-5" />{/if}
				</a>
			{/each}
		</nav>
	{:else}
		<div class="px-3 pb-2">
			<button
				class="flex h-9 w-full items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-400 transition hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900"
				onclick={() => (shell.palette = true)}
			>
				<Search class="size-4" />
				<span class="flex-1 text-left">Cari menu…</span>
				<kbd class="hidden rounded border border-stone-200 bg-white px-1.5 text-[10px] font-medium sm:inline dark:border-stone-700 dark:bg-stone-800">Ctrl K</kbd>
			</button>
		</div>
		<nav class="flex-1 overflow-y-auto overscroll-contain px-3 pt-1 pb-4">
			<a
				href="/"
				onclick={onnavigate}
				class="mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition {path === '/'
					? 'text-stone-900 dark:text-white'
					: 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800/60'}"
			>
				<span class="grid size-7 place-items-center rounded-lg {path === '/' ? 'bg-brand-500 text-white shadow-sm shadow-stone-900/20' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}">
					<LayoutDashboard class="size-4" />
				</span>
				Dashboard
			</a>
			<MenuTree nodes={tree} {onnavigate} />
		</nav>
		{#if auth.user}
			<a href="/profil" onclick={onnavigate} class="m-3 flex items-center gap-3 rounded-xl border border-stone-200 p-2.5 transition hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/50">
				<Avatar id={auth.user.id} name={auth.user.name} ver={auth.user.avatar} />
				<span class="min-w-0 flex-1 leading-tight">
					<span class="block truncate text-sm font-medium">{auth.user.name}</span>
					<span class="block truncate text-xs text-stone-500">{auth.accessLabel}</span>
				</span>
			</a>
		{/if}
	{/if}
</div>
