<script lang="ts">
	import { page } from '$app/state';
	import { House, LayoutGrid, Search, UserRound } from '@lucide/svelte';
	import { shell } from '#lib/erp/ui.svelte.ts';

	const path = $derived(page.url.pathname);
	const item = 'flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 text-[10px] font-medium transition';
	const on = 'text-brand-600 dark:text-brand-400';
	const off = 'text-stone-500 dark:text-stone-400';
</script>

<nav class="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-stone-200/80 bg-white/90 backdrop-blur-xl lg:hidden dark:border-stone-800 dark:bg-stone-950/90">
	<div class="flex">
		<a href="/" class="{item} {path === '/' ? on : off}"><House class="size-5" />Beranda</a>
		<button class="{item} {shell.drawer ? on : off}" onclick={() => (shell.drawer = true)}><LayoutGrid class="size-5" />Menu</button>
		<button class="{item} {shell.palette ? on : off}" onclick={() => (shell.palette = true)}><Search class="size-5" />Cari</button>
		<a href="/profil" class="{item} {path === '/profil' ? on : off}"><UserRound class="size-5" />Profil</a>
	</div>
</nav>
