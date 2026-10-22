<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ChevronRight, LogOut, Menu as MenuIcon, Moon, Search, Sun, UserRound, WifiOff } from '@lucide/svelte';
	import Menu from '../Menu.svelte';
	import { tooltip } from '#lib/ui/tooltip.ts';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { chain } from '#lib/erp/menu.ts';
	import { shell } from '#lib/erp/ui.svelte.ts';
	import { initials } from '#lib/erp/format.ts';

	const crumbs = $derived(chain(page.url.pathname));
	const title = $derived(crumbs.at(-1)?.label ?? (page.url.pathname === '/profil' ? 'Profil' : 'Dashboard'));
	let online = $state(navigator.onLine);

	function logout() {
		auth.logout();
		goto('/login');
	}
</script>

<svelte:window ononline={() => (online = true)} onoffline={() => (online = false)} />

<header class="pt-safe sticky top-0 z-30 border-b border-stone-200/70 bg-white/80 backdrop-blur-xl dark:border-stone-800/70 dark:bg-stone-950/80">
	<div class="flex h-14 items-center gap-2 px-3 sm:px-6 lg:h-16 lg:px-8">
		<button class="btn btn-ghost btn-icon lg:hidden" onclick={() => (shell.drawer = true)} aria-label="Buka menu" {@attach tooltip()}>
			<MenuIcon class="size-5" />
		</button>

		<div class="min-w-0 flex-1">
			<!-- mobile: judul -->
			<div class="lg:hidden">
				{#if crumbs.length > 1}<p class="truncate text-[11px] leading-none text-stone-400">{crumbs[0].label}</p>{/if}
				<h1 class="truncate text-[15px] font-medium">{title}</h1>
			</div>
			<!-- desktop: breadcrumb -->
			<nav class="hidden items-center gap-1.5 text-sm lg:flex" aria-label="Breadcrumb">
				<a href="/" class="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">Beranda</a>
				{#each crumbs as c, i (c.path)}
					<ChevronRight class="size-3.5 text-stone-300 dark:text-stone-600" />
					{#if i === crumbs.length - 1}
						<span class="font-medium">{c.label}</span>
					{:else}
						<a href={c.path} class="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">{c.label}</a>
					{/if}
				{/each}
			</nav>
		</div>

		{#if !online}
			<span class="badge bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" {@attach tooltip('Tidak ada koneksi — data tetap tersimpan di perangkat')}><WifiOff class="size-3" /> Offline</span>
		{/if}
		<button class="btn btn-ghost btn-icon" onclick={() => (shell.palette = true)} aria-label="Cari menu" {@attach tooltip(undefined, { kbd: 'Ctrl K', placement: 'bottom' })}><Search class="size-5" /></button>
		<button class="btn btn-ghost btn-icon" onclick={() => shell.toggleTheme()} aria-label={shell.dark ? 'Mode terang' : 'Mode gelap'} {@attach tooltip(undefined, { placement: 'bottom' })}>
			{#if shell.dark}<Sun class="size-5" />{:else}<Moon class="size-5" />{/if}
		</button>

		<div class="hidden lg:block">
			<Menu
				items={[
					{ label: 'Profil & Pengaturan', icon: UserRound, href: '/profil' },
					{ label: shell.dark ? 'Mode terang' : 'Mode gelap', icon: shell.dark ? Sun : Moon, onclick: () => shell.toggleTheme() },
					{ label: 'Keluar', icon: LogOut, onclick: logout, danger: true }
				]}
			>
				{#snippet trigger(props)}
					<button {...props} class="flex items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-stone-100 aria-expanded:bg-stone-100 dark:hover:bg-stone-800 dark:aria-expanded:bg-stone-800">
						<span class="grid size-8 place-items-center rounded-full bg-brand-500 text-xs font-semibold text-white">{initials(auth.user?.name)}</span>
						<span class="text-sm font-medium">{auth.user?.name.split(' ')[0]}</span>
					</button>
				{/snippet}
				{#snippet header()}
					<div class="px-3 py-2">
						<p class="text-sm font-medium">{auth.user?.name}</p>
						<p class="text-xs text-stone-500">{auth.accessLabel} · @{auth.user?.username}</p>
					</div>
				{/snippet}
			</Menu>
		</div>
	</div>
</header>
