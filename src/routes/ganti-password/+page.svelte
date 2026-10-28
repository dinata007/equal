<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Eye, EyeOff, KeyRound, LogOut } from '@lucide/svelte';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { toast } from '#lib/state/ui.svelte.ts';
	import Logo from '#lib/components/ui/Logo.svelte';

	let current = $state('');
	let next = $state('');
	let confirm = $state('');
	let show = $state(false);
	let error = $state('');
	let loading = $state(false);

	$effect(() => {
		if (!auth.user) goto('/login', { replace: true });
	});
	const forced = $derived(!!auth.user?.mustChange);

	// syarat sama dengan server (server tetap memeriksa ulang)
	const checks = $derived([
		{ ok: next.length >= 8, label: 'Minimal 8 karakter', msg: 'Password minimal 8 karakter' },
		{ ok: !!next && !next.toLowerCase().includes(auth.user?.username.toLowerCase() ?? '\u0000'), label: 'Tidak memuat username', msg: 'Password tidak boleh memuat username' },
		{ ok: !!next && next !== current, label: 'Berbeda dari password lama', msg: 'Password baru harus berbeda dari password lama' },
		{ ok: !!confirm && next === confirm, label: 'Konfirmasi sama', msg: 'Konfirmasi password tidak sama' }
	]);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		const failed = checks.find((c) => !c.ok);
		if (failed) return (error = failed.msg);
		loading = true;
		error = (await auth.changePassword(current, next)) ?? '';
		loading = false;
		if (error) return;
		toast.success('Password berhasil diganti');
		goto('/', { replace: true });
	}
	async function logout() {
		await auth.logout();
		goto('/login');
	}
</script>

<svelte:head><title>Ganti Password · Senja ERP</title></svelte:head>

{#if auth.user}
	<div class="grid min-h-dvh place-items-center bg-canvas px-5 py-10 dark:bg-stone-950">
		<div class="w-full max-w-sm">
			<div class="mb-8 flex justify-center"><Logo size="lg" /></div>
			<div class="card p-6">
				<div class="mb-5 flex items-center gap-3">
					<span class="grid size-10 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/15"><KeyRound class="size-5" /></span>
					<div>
						<h1 class="text-lg font-medium">Ganti Password</h1>
						<p class="text-xs text-stone-500">@{auth.user.username}</p>
					</div>
				</div>
				{#if forced}
					<p class="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
						Anda masuk dengan password sementara. Buat password baru untuk melanjutkan.
					</p>
				{/if}
				<form class="space-y-4" onsubmit={submit}>
					<div>
						<label class="label" for="pw-cur">{forced ? 'Password sementara' : 'Password saat ini'}</label>
						<input id="pw-cur" class="input" type={show ? 'text' : 'password'} bind:value={current} autocomplete="current-password" required />
					</div>
					<div>
						<label class="label" for="pw-new">Password baru</label>
						<div class="relative">
							<input id="pw-new" class="input pr-11" type={show ? 'text' : 'password'} bind:value={next} autocomplete="new-password" required />
							<button type="button" class="absolute inset-y-0 right-0 grid w-11 place-items-center text-stone-400" onclick={() => (show = !show)} aria-label="Tampilkan password">
								{#if show}<EyeOff class="size-4" />{:else}<Eye class="size-4" />{/if}
							</button>
						</div>
					</div>
					<div>
						<label class="label" for="pw-conf">Ulangi password baru</label>
						<input id="pw-conf" class="input" type={show ? 'text' : 'password'} bind:value={confirm} autocomplete="new-password" required />
					</div>
					<ul class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
						{#each checks as c (c.label)}
							<li class={c.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}>{c.ok ? '✓' : '○'} {c.label}</li>
						{/each}
					</ul>
					{#if error}<p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10">{error}</p>{/if}
					<button class="btn btn-primary h-11 w-full" disabled={loading}>
						{#if loading}<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>{/if}
						Simpan Password Baru
					</button>
				</form>
			</div>
			<div class="mt-4 flex justify-center">
				{#if forced}
					<button class="btn btn-ghost btn-sm" onclick={logout}><LogOut class="size-3.5" /> Logout</button>
				{:else}
					<a href="/profil" class="btn btn-ghost btn-sm"><ArrowLeft class="size-3.5" /> Kembali</a>
				{/if}
			</div>
		</div>
	</div>
{/if}
