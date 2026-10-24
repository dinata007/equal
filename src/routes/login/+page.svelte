<script lang="ts">
	import { goto } from '$app/navigation';
	import { Eye, EyeOff, LogIn, TriangleAlert } from '@lucide/svelte';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import InstallAppButton from '#lib/components/InstallAppButton.svelte';
	import Logo from '#lib/components/Logo.svelte';

	let username = $state('');
	let password = $state('');
	let show = $state(false);
	let error = $state('');
	let loading = $state(false);
	let passwordEl = $state<HTMLInputElement>();
	// mulai 2026: tahun ini saja, tahun berikutnya jadi rentang (2026 - 2027)
	const year = new Date().getFullYear();
	const copyright = `© ${year > 2026 ? `2026 - ${year}` : 2026} IBS All rights reserved.`;

	$effect(() => {
		if (auth.user) goto(auth.user.mustChange ? '/ganti-password' : '/', { replace: true });
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = '';
		error = (await auth.login(username, password)) ?? '';
		if (error) password = '';
		loading = false;
	}
</script>

<svelte:head><title>Login · ruangSenja ERP</title></svelte:head>

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
			<p class="text-xs text-stone-400">{copyright}</p>
		</div>
	</div>

	<!-- form: logo (HP) + form di tengah layar, footer menempel di bawah -->
	<div class="flex flex-col bg-canvas lg:bg-white dark:bg-stone-950 lg:dark:bg-stone-950">
		<div class="flex flex-1 items-center justify-center px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10">
			<div class="w-full max-w-sm">
				<div class="mb-10 flex flex-col items-center lg:hidden">
					<Logo size="lg" />
					<span class="mt-3 text-[10px] font-semibold tracking-[.3em] text-stone-400 uppercase">ERP Suite</span>
				</div>
				<h2 class="text-2xl font-medium">Selamat datang 👋</h2>
				<p class="mt-1 text-sm text-stone-500">Login dengan user terdaftar untuk masuk ke ERP.</p>

				<form class="mt-8 space-y-4" onsubmit={submit}>
					<div>
						<label class="label" for="u">Username</label>
						<!-- svelte-ignore a11y_autofocus -->
						<!-- Enter di username → pindah ke password (bukan langsung Login) -->
						<input
							id="u"
							class="input"
							bind:value={username}
							autocomplete="username"
							autocapitalize="none"
							enterkeyhint="next"
							required
							autofocus
							onkeydown={(e) => {
								if (e.key !== 'Enter' || e.isComposing) return;
								e.preventDefault();
								if (username.trim()) passwordEl?.focus();
							}}
						/>
					</div>
					<div>
						<label class="label" for="p">Password</label>
						<div class="relative">
							<input bind:this={passwordEl} id="p" class="input pr-11" type={show ? 'text' : 'password'} bind:value={password} autocomplete="current-password" enterkeyhint="go" required />
							<button type="button" class="absolute inset-y-0 right-0 grid w-11 place-items-center text-stone-400" onclick={() => (show = !show)} aria-label="Tampilkan password">
								{#if show}<EyeOff class="size-4" />{:else}<Eye class="size-4" />{/if}
							</button>
						</div>
					</div>
					{#if error}<p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10">{error}</p>{/if}
					<button class="btn btn-primary h-11 w-full" disabled={loading || !auth.dbReady}>
						{#if loading}<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>{:else}<LogIn class="size-4" />{/if}
						Login
					</button>
				</form>

				{#if !auth.dbReady || auth.dbError}
					<div class="mt-6 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
						<TriangleAlert class="mt-0.5 size-4 shrink-0" />
						<p>
							{#if !auth.dbReady}Database belum dikonfigurasi. Salin <code class="font-mono text-xs">.env.example</code> menjadi <code class="font-mono text-xs">.env</code>, isi koneksi SQL Server, lalu jalankan ulang aplikasi.
							{:else}{auth.dbError}. Periksa server SQL & isi <code class="font-mono text-xs">.env</code>.{/if}
						</p>
					</div>
				{/if}
				<div class="mt-8"><InstallAppButton variant="login" /></div>
			</div>
		</div>
		<footer class="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-xs text-stone-400 lg:hidden">{copyright}</footer>
	</div>
</div>
