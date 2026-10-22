<script lang="ts">
	import { goto, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { fade, fly } from 'svelte/transition';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { shell } from '#lib/erp/ui.svelte.ts';
	import Sidebar from '#lib/components/shell/Sidebar.svelte';
	import Topbar from '#lib/components/shell/Topbar.svelte';
	import BottomNav from '#lib/components/shell/BottomNav.svelte';
	import CommandPalette from '#lib/components/shell/CommandPalette.svelte';
	import { negativeRed } from '#lib/ui/negative.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	$effect(() => {
		if (!auth.user) goto('/login', { replace: true });
	});
	// View Transitions API: perpindahan halaman memudar halus (hanya bila didukung & tidak reduced-motion)
	onNavigate((nav) => {
		if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (nav.from?.url.pathname === nav.to?.url.pathname) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await nav.complete;
			});
		});
	});
	// tutup drawer saat navigasi
	$effect(() => {
		void page.url.pathname;
		shell.drawer = false;
	});
</script>

{#if auth.user}
	<div class="min-h-dvh" {@attach negativeRed}>
		<aside
			class="fixed inset-y-0 left-0 z-40 hidden border-r border-stone-200/70 bg-white transition-[width] duration-200 lg:block dark:border-stone-800/70 dark:bg-stone-950 {shell.collapsed
				? 'w-[76px]'
				: 'w-72'}"
		>
			<Sidebar collapsed={shell.collapsed} />
		</aside>

		<div class="flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200 {shell.collapsed ? 'lg:pl-[76px]' : 'lg:pl-72'}">
			<Topbar />
			<main class="mx-auto w-full max-w-[1600px] flex-1 px-3 pt-4 pb-28 sm:px-6 lg:px-8 lg:pt-6 lg:pb-10">
				{@render children()}
			</main>
		</div>

		{#if shell.drawer}
			<div class="fixed inset-0 z-50 lg:hidden">
				<button class="absolute inset-0 bg-stone-950/50 backdrop-blur-sm" transition:fade={{ duration: 150 }} onclick={() => (shell.drawer = false)} aria-label="Tutup menu"></button>
				<aside class="pt-safe pb-safe absolute inset-y-0 left-0 w-[86%] max-w-80 bg-white shadow-2xl dark:bg-stone-950" transition:fly={{ x: -320, duration: 220, opacity: 1 }}>
					<Sidebar onnavigate={() => (shell.drawer = false)} />
				</aside>
			</div>
		{/if}

		<BottomNav />
		<CommandPalette />
	</div>
{/if}
