<script lang="ts">
	import { goto } from '$app/navigation';
	import { Database, LogOut, Moon, RotateCcw, Smartphone, Sun } from '@lucide/svelte';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { initials } from '#lib/erp/format.ts';
	import { ask, shell, toast } from '#lib/erp/ui.svelte.ts';

	let installEvt = $state<any>(null);
	const standalone = matchMedia('(display-mode: standalone)').matches;

	function logout() {
		auth.logout();
		goto('/login');
	}
	async function reset() {
		if (!(await ask({ title: 'Reset data prototipe?', message: 'Semua perubahan akan hilang dan data contoh dibuat ulang.', danger: true, confirmText: 'Reset' }))) return;
		db.reset();
		toast.success('Data prototipe direset');
	}
	async function install() {
		installEvt?.prompt();
		installEvt = null;
	}
	const size = $derived(Math.round(JSON.stringify(db.t).length / 1024));
</script>

<svelte:window onbeforeinstallprompt={(e) => (e.preventDefault(), (installEvt = e))} />
<svelte:head><title>Profil · ruangSenja</title></svelte:head>

<div class="mx-auto max-w-xl space-y-4">
	<div class="card flex items-center gap-4 p-5">
		<span class="grid size-16 place-items-center rounded-full bg-brand-500 text-xl font-semibold text-white">{initials(auth.user?.name)}</span>
		<div class="min-w-0">
			<h1 class="truncate text-lg font-medium">{auth.user?.name}</h1>
			<p class="text-sm text-stone-500">@{auth.user?.username} · {auth.accessLabel}</p>
			{#if auth.user?.storeId}<p class="text-xs text-stone-400">Toko: {db.name('stores', auth.user.storeId)}</p>{/if}
		</div>
	</div>

	<div class="card divide-y divide-stone-100 dark:divide-stone-800">
		<button class="flex w-full items-center gap-3 px-5 py-4 text-left" onclick={() => shell.toggleTheme()}>
			{#if shell.dark}<Sun class="size-5 text-stone-400" />{:else}<Moon class="size-5 text-stone-400" />{/if}
			<span class="flex-1 text-sm">Mode {shell.dark ? 'terang' : 'gelap'}</span>
		</button>
		{#if installEvt && !standalone}
			<button class="flex w-full items-center gap-3 px-5 py-4 text-left" onclick={install}>
				<Smartphone class="size-5 text-stone-400" />
				<span class="flex-1 text-sm">Pasang aplikasi di perangkat</span>
			</button>
		{/if}
		<div class="flex items-center gap-3 px-5 py-4">
			<Database class="size-5 text-stone-400" />
			<span class="flex-1 text-sm">Data prototipe lokal <span class="text-stone-400">({size} KB)</span></span>
			{#if auth.admin}
				<button class="btn btn-secondary btn-sm" onclick={reset}><RotateCcw class="size-3.5" /> Reset</button>
			{/if}
		</div>
		<button class="flex w-full items-center gap-3 px-5 py-4 text-left text-rose-600" onclick={logout}>
			<LogOut class="size-5" />
			<span class="flex-1 text-sm font-medium">Keluar</span>
		</button>
	</div>

	<p class="text-center text-xs text-stone-400">ruangSenja ERP · Prototipe UI/UX · data tersimpan di browser ini</p>
</div>
