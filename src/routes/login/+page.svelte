<script lang="ts">
	import { goto } from '$app/navigation';
	import { Eye, EyeOff, LogIn } from '@lucide/svelte';
	import { accessLabel, auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import type { User } from '#lib/erp/types.ts';
	import Logo from '#lib/components/Logo.svelte';

	let username = $state('');
	let password = $state('');
	let show = $state(false);
	let error = $state('');
	let loading = $state(false);

	$effect(() => {
		if (auth.user) goto('/', { replace: true });
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = '';
		await new Promise((r) => setTimeout(r, 350));
		error = auth.login(username, password) ?? '';
		loading = false;
	}

	const demo = $derived(
		db.all<User>('users').filter((u) => u.active).map((u) => ({ ...u, role: accessLabel(u) }))
	);
</script>

<svelte:head><title>Masuk · ruangSenja ERP</title></svelte:head>

<div class="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
	<!-- panel brand -->
	<div class="relative hidden overflow-hidden bg-canvas lg:block dark:bg-stone-900">
		<img src="/icon.svg" alt="" aria-hidden="true" class="pointer-events-none absolute -right-40 -bottom-40 size-[34rem] opacity-[.07] dark:opacity-[.12]" />
		<div class="relative flex h-full flex-col justify-between p-12">
			<span class="text-xs font-semibold tracking-[.3em] text-stone-400 uppercase">ERP Suite</span>
			<div>
				<Logo size="lg" />
				<p class="mt-8 max-w-md text-lg leading-relaxed text-stone-600 dark:text-stone-300">Satu ruang untuk material, gudang, toko, keuangan & SDM — rapi, ringan, nyaman dipakai dari kantor maupun genggaman.</p>
			</div>
			<p class="text-xs text-stone-400">© {new Date().getFullYear()} ruangSenja</p>
		</div>
	</div>

	<!-- form -->
	<div class="flex flex-col bg-canvas lg:bg-white dark:bg-stone-950 lg:dark:bg-stone-950">
		<div class="pt-safe flex flex-col items-center px-6 pt-14 pb-4 lg:hidden">
			<Logo size="lg" />
			<span class="mt-3 text-[10px] font-semibold tracking-[.3em] text-stone-400 uppercase">ERP Suite</span>
		</div>
		<div class="flex flex-1 items-start justify-center px-5 pt-6 pb-10 lg:items-center">
			<div class="w-full max-w-sm">
				<h2 class="text-2xl font-medium">Selamat datang 👋</h2>
				<p class="mt-1 text-sm text-stone-500">Masuk untuk melanjutkan ke dashboard.</p>

				<form class="mt-8 space-y-4" onsubmit={submit}>
					<div>
						<label class="label" for="u">Username</label>
						<!-- svelte-ignore a11y_autofocus -->
						<input id="u" class="input" bind:value={username} autocomplete="username" autocapitalize="none" required autofocus />
					</div>
					<div>
						<label class="label" for="p">Password</label>
						<div class="relative">
							<input id="p" class="input pr-11" type={show ? 'text' : 'password'} bind:value={password} autocomplete="current-password" required />
							<button type="button" class="absolute inset-y-0 right-0 grid w-11 place-items-center text-stone-400" onclick={() => (show = !show)} aria-label="Tampilkan password">
								{#if show}<EyeOff class="size-4" />{:else}<Eye class="size-4" />{/if}
							</button>
						</div>
					</div>
					{#if error}<p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10">{error}</p>{/if}
					<button class="btn btn-primary h-11 w-full" disabled={loading}>
						{#if loading}<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>{:else}<LogIn class="size-4" />{/if}
						Masuk
					</button>
				</form>

				<div class="mt-8">
					<p class="text-xs font-medium tracking-wide text-stone-400 uppercase">Akun demo (prototipe)</p>
					<div class="mt-3 grid grid-cols-2 gap-2">
						{#each demo as u (u.id)}
							<button
								type="button"
								class="rounded-xl border border-stone-200 bg-white px-3 py-2 text-left transition hover:border-brand-400 hover:bg-brand-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800"
								onclick={() => ((username = u.username), (password = u.password))}
							>
								<span class="block text-sm font-medium">{u.username}</span>
								<span class="block truncate text-xs text-stone-500">{u.role}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
