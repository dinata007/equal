<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronRight, Database, KeyRound, LogOut, Moon, RefreshCw, RotateCcw, Server, Smartphone, Sun } from '@lucide/svelte';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { initials } from '#lib/erp/format.ts';
	import { ask, shell, toast } from '#lib/erp/ui.svelte.ts';

	let installEvt = $state<any>(null);
	const standalone = matchMedia('(display-mode: standalone)').matches;

	async function logout() {
		await auth.logout();
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

	/* status koneksi SQL Server (GET /api/health), khusus admin */
	type Health = { ok: boolean; database?: string; version?: string; target?: string; error?: string };
	let health = $state<Health | null>(null);
	let checking = $state(false);
	async function checkDb() {
		checking = true;
		try {
			health = await (await fetch('/api/health')).json();
		} catch {
			health = { ok: false, error: 'Server aplikasi tidak dapat dihubungi' };
		}
		checking = false;
	}
	$effect(() => {
		if (auth.admin) checkDb();
	});
</script>

<svelte:window onbeforeinstallprompt={(e) => (e.preventDefault(), (installEvt = e))} />
<svelte:head><title>Profil · ruangSenja</title></svelte:head>

<div class="mx-auto max-w-xl space-y-4">
	<div class="card flex items-center gap-4 p-5">
		<span class="grid size-16 place-items-center rounded-full bg-brand-500 text-xl font-semibold text-white">{initials(auth.user?.name)}</span>
		<div class="min-w-0">
			<h1 class="truncate text-lg font-medium">{auth.user?.name}</h1>
			<p class="text-sm text-stone-500">@{auth.user?.username} · {auth.accessLabel}</p>
			{#if auth.user?.storeId}<p class="text-xs text-stone-400">Toko: {db.name('stores', auth.user.storeId) || auth.user.storeId}</p>{/if}
		</div>
	</div>

	<div class="card divide-y divide-stone-100 dark:divide-stone-800">
		<button class="flex w-full items-center gap-3 px-5 py-4 text-left" onclick={() => shell.toggleTheme()}>
			{#if shell.dark}<Sun class="size-5 text-stone-400" />{:else}<Moon class="size-5 text-stone-400" />{/if}
			<span class="flex-1 text-sm">Mode {shell.dark ? 'terang' : 'gelap'}</span>
		</button>
		<a href="/ganti-password" class="flex w-full items-center gap-3 px-5 py-4 text-left">
			<KeyRound class="size-5 text-stone-400" />
			<span class="flex-1 text-sm">Ganti password</span>
			<ChevronRight class="size-4 text-stone-300" />
		</a>
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
		{#if auth.admin}
			<div class="flex items-center gap-3 px-5 py-4">
				<Server class="size-5 shrink-0 text-stone-400" />
				<div class="min-w-0 flex-1 text-sm">
					<p class="flex items-center gap-2">
						Server database
						{#if health}
							<span class="badge {health.ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'}">{health.ok ? 'Terhubung' : 'Tidak terhubung'}</span>
						{/if}
					</p>
					<p class="truncate text-xs text-stone-400" title={health?.error}>
						{#if !health}Memeriksa…{:else if health.ok}{health.database} · SQL Server {health.version}{:else}{health.error}{/if}
					</p>
				</div>
				<button class="btn btn-ghost btn-icon btn-sm" onclick={checkDb} disabled={checking} aria-label="Cek ulang koneksi"><RefreshCw class="size-3.5 {checking ? 'animate-spin' : ''}" /></button>
			</div>
		{/if}
		<button class="flex w-full items-center gap-3 px-5 py-4 text-left text-rose-600" onclick={logout}>
			<LogOut class="size-5" />
			<span class="flex-1 text-sm font-medium">Keluar</span>
		</button>
	</div>

	<p class="text-center text-xs text-stone-400">ruangSenja ERP · Prototipe UI/UX · data tersimpan di browser ini</p>
</div>
