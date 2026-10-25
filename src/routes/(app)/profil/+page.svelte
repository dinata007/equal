<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		Camera,
		CircleCheck,
		Download,
		EllipsisVertical,
		Lock,
		Maximize,
		Rocket,
		Share,
		SquarePlus,
		Zap,
		Check,
		ChevronRight,
		CloudAlert,
		CloudCheck,
		History,
		ImageUp,
		KeyRound,
		LoaderCircle,
		LogIn,
		LogOut,
		Monitor,
		Palette,
		ShieldAlert,
		ShieldCheck,
		Smartphone,
		Tablet,
		Trash2,
		UserRoundX
	} from '@lucide/svelte';
	import type { Component } from 'svelte';
	import AvatarEditor from '#lib/pages/profil/AvatarEditor.svelte';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import Menu from '#lib/components/ui/Menu.svelte';
	import { api, ApiError } from '#lib/util/api.ts';
	import { appearance, clickPoint } from '#lib/state/appearance.svelte.ts';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { db } from '#lib/dev-data/db.svelte.ts';
	import { describeDevice } from '#lib/util/device.ts';
	import { ago, date, dateTime } from '#lib/util/format.ts';
	import { TEXT_SIZES, THEMES, type ThemeMode } from '#lib/domain/prefs.ts';
	import { ask, toast } from '#lib/state/ui.svelte.ts';
	import { pwa } from '#lib/state/pwa.svelte.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';

	const user = $derived(auth.user!);
	const p = $derived(appearance.prefs);

	/* ---------------- foto profil ---------------- */
	let editing = $state<File | null>(null);
	let fileInput = $state<HTMLInputElement>();
	let dropActive = $state(false);

	function pick(files: FileList | File[] | null | undefined) {
		const f = [...(files ?? [])].find((x) => x.type.startsWith('image/'));
		if (f) editing = f;
		else if (files?.length) toast.error('Pilih file gambar (JPG, PNG, atau WebP)');
	}
	async function uploadAvatar(blob: Blob) {
		try {
			const res = await fetch('/api/profil/avatar', { method: 'PUT', headers: { 'content-type': blob.type }, body: blob });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan foto');
			auth.setAvatar(data.avatar);
			toast.success('Foto profil diperbarui');
			return true;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Gagal menyimpan foto');
			return false;
		}
	}
	async function removeAvatar() {
		if (!(await ask({ title: 'Hapus foto profil?', message: 'Foto diganti inisial nama di semua tempat.', danger: true, confirmText: 'Hapus' }))) return;
		try {
			await api('/api/profil/avatar', { method: 'DELETE' });
			auth.setAvatar(null);
			toast.success('Foto profil dihapus');
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus foto');
		}
	}
	// tempel gambar (Ctrl V) di mana saja pada halaman ini
	function onpaste(e: ClipboardEvent) {
		const t = e.target as HTMLElement;
		if (editing || t.closest('input, textarea, [contenteditable]')) return;
		const files = [...(e.clipboardData?.files ?? [])];
		if (files.some((f) => f.type.startsWith('image/'))) {
			e.preventDefault();
			pick(files);
		}
	}
	const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files');

	/* ---------------- keamanan ---------------- */
	interface DeviceSession {
		ref: string;
		current: boolean;
		createdAt: string;
		lastSeenAt: string;
		ip: string | null;
		userAgent: string | null;
	}
	interface Security {
		passwordChangedAt: string | null;
		accountCreatedAt: string | null;
		sessions: DeviceSession[];
		activity: { event: string; at: string; ip: string | null; detail: string | null }[];
	}
	let sec = $state<Security | null>(null);
	let secError = $state('');
	let revoking = $state<string | null>(null);
	let showAllActivity = $state(false);

	async function loadSecurity() {
		try {
			sec = await api<Security>('/api/profil');
			secError = '';
		} catch (e) {
			secError = e instanceof ApiError ? e.message : 'Gagal memuat data keamanan';
		}
	}
	$effect(() => {
		loadSecurity();
	});

	async function revoke(ref: string) {
		const all = ref === '*';
		const others = (sec?.sessions.length ?? 1) - 1;
		const ok = await ask(
			all
				? { title: `Logout ${others} perangkat lain?`, message: 'Perangkat tersebut harus login lagi. Perangkat ini tetap login.', danger: true, confirmText: 'Logout semua' }
				: { title: 'Logout dari perangkat ini?', message: 'Perangkat tersebut harus login lagi untuk memakai aplikasi.', danger: true, confirmText: 'Logout' }
		);
		if (!ok) return;
		revoking = ref;
		try {
			const r = await api<{ revoked: number }>('/api/profil/sesi', { method: 'DELETE', body: { ref } });
			toast.success(r.revoked ? `${r.revoked} perangkat di-logout` : 'Perangkat sudah tidak aktif');
			await loadSecurity();
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal logout perangkat');
		}
		revoking = null;
	}

	const deviceIcon = { desktop: Monitor, phone: Smartphone, tablet: Tablet, other: Monitor } as const;
	const EVENTS: Record<string, { label: string; icon: Component<any>; tone: string }> = {
		login_ok: { label: 'Login berhasil', icon: LogIn, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
		login_fail: { label: 'Login gagal (password salah)', icon: ShieldAlert, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
		login_lock: { label: 'Akun dikunci sementara', icon: ShieldAlert, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' },
		login_locked: { label: 'Login ditolak, akun sedang terkunci', icon: ShieldAlert, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' },
		password_change: { label: 'Password diganti', icon: KeyRound, tone: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' },
		session_revoke: { label: 'Perangkat di-logout', icon: UserRoundX, tone: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' },
		profile_avatar: { label: 'Foto profil diganti', icon: Camera, tone: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' }
	};
	const activity = $derived((sec?.activity ?? []).filter((a) => EVENTS[a.event]));

	/* ---------------- pasang aplikasi ---------------- */
	let installing = $state(false);
	async function install() {
		installing = true;
		const r = await pwa.install();
		installing = false;
		if (r === 'accepted') toast.success('ruangSenja ter-install. Buka dari layar utama atau taskbar.');
	}
	const APP_PERKS = [
		{ icon: Rocket, text: 'Dibuka langsung dari layar utama, taskbar, atau Start' },
		{ icon: Maximize, text: 'Layar penuh tanpa bar alamat & tab browser' },
		{ icon: Zap, text: 'Pintasan Penjualan Toko & Kartu Stok (klik kanan / tahan ikon)' }
	];

	/* ---------------- lainnya ---------------- */
	async function logout() {
		await auth.logout();
		goto('/login');
	}
	async function resetLook() {
		if (await ask({ title: 'Reset tampilan?', message: 'Mode & ukuran teks kembali ke bawaan.', confirmText: 'Reset' })) appearance.reset();
	}
	const setTheme = (id: ThemeMode, e: MouseEvent) => appearance.set({ theme: id }, clickPoint(e));
</script>

<svelte:window {onpaste} />
<svelte:head><title>Profil · ruangSenja</title></svelte:head>

<input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={(e) => (pick(e.currentTarget.files), (e.currentTarget.value = ''))} />
<AvatarEditor bind:file={editing} onsave={uploadAvatar} />

<div class="mx-auto max-w-3xl space-y-5 pb-6">
	<!-- ============ identitas ============ -->
	<section
		class="card relative overflow-hidden transition {dropActive ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-canvas dark:ring-offset-stone-950' : ''}"
		aria-label="Identitas"
		ondragenter={(e) => hasFiles(e) && (dropActive = true)}
		ondragover={(e) => hasFiles(e) && e.preventDefault()}
		ondragleave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && (dropActive = false)}
		ondrop={(e) => (e.preventDefault(), (dropActive = false), pick(e.dataTransfer?.files))}
	>
		<div class="hero h-24 sm:h-28" aria-hidden="true"></div>
		<div class="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-6">
			<div class="relative -mt-12 w-fit sm:-mt-14">
				<button class="group relative block rounded-full ring-4 ring-white dark:ring-stone-900" onclick={() => fileInput?.click()} aria-label="Ganti foto profil" {@attach tooltip()}>
					<Avatar id={user.id} name={user.name} ver={user.avatar} class="size-24 text-2xl sm:size-28 sm:text-3xl" />
					<span class="absolute inset-0 grid place-items-center rounded-full bg-stone-950/45 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
						<Camera class="size-6" />
					</span>
				</button>
				<div class="absolute -right-1 -bottom-1">
					<Menu
						placement="bottom-start"
						items={[
							{ label: 'Upload foto…', icon: ImageUp, onclick: () => fileInput?.click() },
							...(user.avatar != null ? [{ label: 'Hapus foto', icon: Trash2, onclick: removeAvatar, danger: true }] : [])
						]}
					>
						{#snippet trigger(props)}
							<button {...props} class="grid size-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700" aria-label="Pilihan foto">
								<Camera class="size-4" />
							</button>
						{/snippet}
					</Menu>
				</div>
			</div>
			<div class="min-w-0 flex-1 sm:pb-1">
				<h1 class="truncate text-xl font-medium sm:text-2xl">{user.name}</h1>
				<p class="text-sm text-stone-500">@{user.username} · {auth.accessLabel}</p>
				<p class="mt-0.5 text-xs text-stone-400">
					{#if user.storeId}Toko {db.name('stores', user.storeId) || user.storeId} · {/if}{#if sec?.accountCreatedAt}Bergabung {date(sec.accountCreatedAt)}{/if}
				</p>
			</div>
			<p class="hidden max-w-44 text-right text-xs leading-snug text-stone-400 lg:block">Drag & drop gambar ke kartu ini atau paste dengan <kbd class="rounded border border-stone-200 px-1 font-sans dark:border-stone-700">Ctrl V</kbd></p>
		</div>
		{#if dropActive}
			<div class="pointer-events-none absolute inset-0 grid place-items-center bg-brand-50/85 text-brand-700 backdrop-blur-[2px] dark:bg-stone-900/85 dark:text-brand-300">
				<span class="flex items-center gap-2 font-medium"><ImageUp class="size-5" /> Drop untuk memakai sebagai foto profil</span>
			</div>
		{/if}
	</section>

	<!-- ============ tampilan ============ -->
	<section class="card" aria-labelledby="look-title">
		<header class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-stone-100 px-5 py-4 sm:px-6 dark:border-stone-800">
			<span class="grid size-9 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"><Palette class="size-4.5" /></span>
			<div class="min-w-0 flex-1">
				<h2 id="look-title" class="text-base font-medium">Tampilan</h2>
				<p class="text-xs text-stone-500">Tersimpan di akun, jadi ikut ke semua perangkat.</p>
			</div>
			<span class="flex items-center gap-1.5 text-xs text-stone-500" aria-live="polite">
				{#if appearance.sync === 'saving'}
					<LoaderCircle class="size-3.5 animate-spin" /> Menyimpan…
				{:else if appearance.sync === 'error'}
					<CloudAlert class="size-3.5 text-rose-500" /> <span class="text-rose-600 dark:text-rose-400">Gagal tersimpan</span>
					<button class="btn btn-ghost btn-sm" onclick={() => appearance.retry()}>Coba lagi</button>
				{:else if appearance.sync === 'saved'}
					<CloudCheck class="size-3.5 text-emerald-500" /> Tersimpan
				{/if}
			</span>
			{#if !appearance.isDefault}
				<button class="btn btn-ghost btn-sm" onclick={resetLook}>Reset</button>
			{/if}
		</header>

		<div class="space-y-7 px-5 py-5 sm:px-6">
			<!-- mode -->
			<fieldset>
				<legend class="label">Mode</legend>
				<div class="grid grid-cols-3 gap-2.5 sm:gap-3">
					{#each THEMES as t (t.id)}
						<label class="choice group cursor-pointer">
							<input type="radio" name="theme" class="sr-only" checked={p.theme === t.id} onclick={(e) => setTheme(t.id, e)} />
							<span class="block overflow-hidden rounded-xl border-2 transition {p.theme === t.id ? 'border-brand-500' : 'border-stone-200 group-hover:border-stone-300 dark:border-stone-700 dark:group-hover:border-stone-600'}">
								<span class="relative block aspect-16/10">
									{@render mock('light')}
									{#if t.id !== 'light'}
										<span class="absolute inset-0 {t.id === 'system' ? 'split' : ''}">{@render mock('dark')}</span>
									{/if}
								</span>
							</span>
							<span class="mt-1.5 flex items-center justify-center gap-1 text-xs font-medium {p.theme === t.id ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500'}">
								{#if p.theme === t.id}<Check class="size-3.5 text-brand-500" />{/if}{t.label}
							</span>
						</label>
					{/each}
				</div>
			</fieldset>

			<!-- ukuran teks -->
			<fieldset>
				<legend class="label">Ukuran teks</legend>
				<div class="inline-flex w-full rounded-xl bg-stone-100 p-1 sm:w-auto dark:bg-stone-800">
					{#each TEXT_SIZES as s, i (s.id)}
						<label class="choice flex-1 cursor-pointer sm:flex-none">
							<input type="radio" name="textsize" class="sr-only" checked={p.textSize === s.id} onchange={() => appearance.set({ textSize: s.id })} />
							<span class="flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition sm:px-4 {p.textSize === s.id ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}">
								<span class="font-semibold" style="font-size: {12 + i * 2}px">A</span><span class="hidden sm:inline">{s.label}</span>
							</span>
						</label>
					{/each}
				</div>
				<p class="mt-2 text-xs text-stone-400">Semua teks, tombol & jarak ikut berskala. Cocok untuk layar besar atau dibaca dari jauh.</p>
			</fieldset>

		</div>
	</section>

	<!-- ============ keamanan ============ -->
	<section class="card" aria-labelledby="sec-title">
		<header class="flex items-center gap-3 border-b border-stone-100 px-5 py-4 sm:px-6 dark:border-stone-800">
			<span class="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"><ShieldCheck class="size-4.5" /></span>
			<div class="min-w-0 flex-1">
				<h2 id="sec-title" class="text-base font-medium">Keamanan</h2>
				<p class="text-xs text-stone-500">Password, perangkat yang sedang login & aktivitas akun.</p>
			</div>
		</header>

		<a href="/ganti-password" class="flex items-center gap-3 border-b border-stone-100 px-5 py-4 transition hover:bg-stone-50 sm:px-6 dark:border-stone-800 dark:hover:bg-stone-800/40">
			<KeyRound class="size-5 text-stone-400" />
			<span class="min-w-0 flex-1">
				<span class="block text-sm font-medium">Password</span>
				<span class="block text-xs text-stone-500">{sec?.passwordChangedAt ? `Terakhir diganti ${ago(sec.passwordChangedAt)}` : 'Ganti secara berkala untuk keamanan'}</span>
			</span>
			<span class="text-sm text-stone-500">Ganti</span>
			<ChevronRight class="size-4 text-stone-300" />
		</a>

		{#if secError}
			<p class="px-5 py-4 text-sm text-rose-600 sm:px-6">{secError} <button class="btn btn-ghost btn-sm" onclick={loadSecurity}>Coba lagi</button></p>
		{:else if !sec}
			<div class="space-y-3 px-5 py-5 sm:px-6" aria-busy="true" aria-label="Memuat">
				{#each [1, 2] as i (i)}<div class="h-12 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800"></div>{/each}
			</div>
		{:else}
			<!-- perangkat aktif -->
			<div class="border-b border-stone-100 px-5 py-4 sm:px-6 dark:border-stone-800">
				<div class="mb-2 flex items-center gap-2">
					<h3 class="flex-1 text-sm font-medium">Perangkat aktif <span class="font-normal text-stone-400">· {sec.sessions.length}</span></h3>
					{#if sec.sessions.length > 1}
						<button class="btn btn-ghost btn-sm text-rose-600 dark:text-rose-400" onclick={() => revoke('*')} disabled={!!revoking}>
							{#if revoking === '*'}<LoaderCircle class="size-3.5 animate-spin" />{/if}Logout semua perangkat lain
						</button>
					{/if}
				</div>
				<ul class="-mx-2">
					{#each sec.sessions as s (s.ref)}
						{@const d = describeDevice(s.userAgent)}
						{@const DevIcon = deviceIcon[d.kind]}
						<li class="flex items-center gap-3 rounded-xl px-2 py-2.5">
							<span class="grid size-10 shrink-0 place-items-center rounded-xl {s.current ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}"><DevIcon class="size-5" /></span>
							<span class="min-w-0 flex-1">
								<span class="flex items-center gap-2 text-sm font-medium">
									<span class="truncate">{d.browser} · {d.os}</span>
									{#if s.current}<span class="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">Perangkat ini</span>{/if}
								</span>
								<span class="block truncate text-xs text-stone-500">
									{s.ip ?? 'IP tidak diketahui'} ·
									<span {@attach tooltip(`Login ${dateTime(s.createdAt)}`)}>{s.current ? 'aktif sekarang' : `aktif ${ago(s.lastSeenAt)}`}</span>
								</span>
							</span>
							{#if !s.current}
								<button class="btn btn-ghost btn-sm text-stone-500 hover:text-rose-600" onclick={() => revoke(s.ref)} disabled={!!revoking}>
									{#if revoking === s.ref}<LoaderCircle class="size-3.5 animate-spin" />{:else}<LogOut class="size-3.5" />{/if}Logout
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			</div>

			<!-- aktivitas -->
			<div class="px-5 py-4 sm:px-6">
				<h3 class="mb-3 flex items-center gap-2 text-sm font-medium"><History class="size-4 text-stone-400" /> Aktivitas terbaru</h3>
				{#if !activity.length}
					<p class="text-sm text-stone-400">Belum ada aktivitas tercatat.</p>
				{:else}
					<ol class="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-3.75 before:w-px before:bg-stone-200 dark:before:bg-stone-800">
						{#each showAllActivity ? activity : activity.slice(0, 5) as a, i (a.at + i)}
							{@const m = EVENTS[a.event]}
							<li class="relative flex items-start gap-3">
								<span class="relative grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-white dark:ring-stone-900 {m.tone}"><m.icon class="size-4" /></span>
								<span class="min-w-0 flex-1 pt-1">
									<span class="block text-sm">{m.label}{#if a.event === 'session_revoke' && a.detail}<span class="text-stone-500"> · {a.detail}</span>{/if}</span>
									<span class="block text-xs text-stone-500"><span {@attach tooltip(dateTime(a.at))}>{ago(a.at)}</span>{#if a.ip} · {a.ip}{/if}</span>
								</span>
							</li>
						{/each}
					</ol>
					{#if activity.length > 5}
						<button class="btn btn-ghost btn-sm mt-3" onclick={() => (showAllActivity = !showAllActivity)}>
							{showAllActivity ? 'Tampilkan lebih sedikit' : `Lihat semua (${activity.length})`}
						</button>
					{/if}
				{/if}
			</div>
		{/if}
	</section>

	<!-- ============ aplikasi (PWA) ============ -->
	<section class="card overflow-hidden" aria-labelledby="app-title">
		<div class="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
			<div class="flex items-start gap-4 sm:w-60 sm:shrink-0 sm:flex-col">
				<img src="/icon-192.png" alt="" class="size-16 rounded-2xl shadow-md ring-1 ring-stone-900/5 sm:size-20" />
				<div class="min-w-0">
					<h2 id="app-title" class="text-base font-medium">Aplikasi ruangSenja</h2>
					{#if pwa.route === 'installed'}
						<p class="mt-1 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400"><CircleCheck class="size-4" /> Sedang dipakai sebagai aplikasi</p>
					{:else if pwa.installedNow}
						<p class="mt-1 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400"><CircleCheck class="size-4" /> Ter-install di perangkat ini</p>
					{:else}
						<p class="mt-1 text-sm text-stone-500">Install di HP atau komputer agar terasa seperti aplikasi biasa.</p>
					{/if}
				</div>
			</div>

			<div class="min-w-0 flex-1">
				{#if pwa.route === 'installed' || pwa.installedNow}
					<ul class="space-y-2.5">
						{#each APP_PERKS as perk (perk.text)}
							<li class="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-300"><Check class="mt-0.5 size-4 shrink-0 text-emerald-500" />{perk.text}</li>
						{/each}
					</ul>
				{:else}
					<ul class="space-y-2.5">
						{#each APP_PERKS as perk (perk.text)}
							<li class="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-300"><perk.icon class="mt-0.5 size-4 shrink-0 text-brand-500" />{perk.text}</li>
						{/each}
					</ul>

					<div class="mt-5 rounded-xl bg-stone-50 p-4 dark:bg-stone-800/50">
						{#if pwa.route === 'prompt'}
							<div class="flex flex-wrap items-center gap-3">
								<button class="btn btn-primary h-10 px-4" onclick={install} disabled={installing}>
									{#if installing}<LoaderCircle class="size-4 animate-spin" />{:else}<Download class="size-4" />{/if} Install App
								</button>
							</div>
						{:else if pwa.route === 'ios'}
							<p class="mb-3 text-sm font-medium">Install di iPhone / iPad</p>
							<ol class="space-y-2.5 text-sm text-stone-600 dark:text-stone-300">
								<li class="flex items-start gap-3"><span class="step">1</span><span class="pt-0.5">Buka halaman ini di <b class="font-medium">Safari</b></span></li>
								<li class="flex items-start gap-3"><span class="step">2</span><span class="pt-0.5">Ketuk <Share class="inline size-4 -translate-y-px text-sky-600" /> <b class="font-medium">Share</b> (Bagikan) di bawah layar</span></li>
								<li class="flex items-start gap-3"><span class="step">3</span><span class="pt-0.5">Pilih <SquarePlus class="inline size-4 -translate-y-px" /> <b class="font-medium">Add to Home Screen</b> (Tambahkan ke Layar Utama), lalu <b class="font-medium">Add</b></span></li>
							</ol>
						{:else if pwa.route === 'mac-safari'}
							<p class="text-sm text-stone-600 dark:text-stone-300">Di Safari: menu <b class="font-medium">File › Add to Dock</b> (macOS Sonoma ke atas).</p>
						{:else if pwa.route === 'firefox'}
							<p class="text-sm text-stone-600 dark:text-stone-300">Firefox di komputer belum bisa install aplikasi web. Buka ruangSenja di <b class="font-medium">Chrome</b> atau <b class="font-medium">Edge</b>, lalu install dari sini.</p>
						{:else if pwa.route === 'insecure'}
							<p class="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
								<Lock class="mt-0.5 size-4 shrink-0" />
								<span>Browser hanya mengizinkan install lewat koneksi aman (<b class="font-medium">https://</b>). Alamat ini masih http. Minta admin memasang sertifikat HTTPS di server.</span>
							</p>
						{:else}
							<p class="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
								<EllipsisVertical class="mt-0.5 size-4 shrink-0" />
								<span>Buka menu browser, lalu pilih <b class="font-medium">Install ruangSenja</b> / <b class="font-medium">Install app</b>. Bila tidak ada, aplikasi mungkin sudah ter-install. Cari "ruangSenja" di perangkat ini.</span>
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- ============ lainnya ============ -->
	<section class="card" aria-label="Lainnya">
		<button class="flex w-full items-center gap-3 px-5 py-4 text-left text-rose-600 transition hover:bg-rose-50/60 sm:px-6 dark:text-rose-400 dark:hover:bg-rose-500/10" onclick={logout}>
			<LogOut class="size-5" />
			<span class="flex-1 text-sm font-medium">Logout</span>
		</button>
	</section>

	<p class="text-center text-xs text-stone-400">ruangSenja ERP</p>
</div>

<!-- miniatur aplikasi untuk pilihan mode (warna tetap, tidak ikut tema yang aktif) -->
{#snippet mock(mode: 'light' | 'dark')}
	{@const L = mode === 'light'}
	<span class="absolute inset-0 flex gap-1.5 p-1.5" style="background: {L ? '#f2f1ef' : '#0c0a09'}">
		<span class="flex w-1/4 flex-col gap-1 rounded-md p-1" style="background: {L ? '#fff' : '#1c1917'}">
			<span class="h-1.5 w-3/4 rounded-full bg-brand-500"></span>
			{#each [1, 2, 3] as i (i)}<span class="h-1 rounded-full" style="background: {L ? '#e7e5e4' : '#292524'}"></span>{/each}
		</span>
		<span class="flex flex-1 flex-col gap-1.5">
			<span class="h-2 rounded-md" style="background: {L ? '#fff' : '#1c1917'}"></span>
			<span class="flex flex-1 gap-1.5">
				{#each [1, 2] as i (i)}
					<span class="flex flex-1 flex-col justify-end gap-1 rounded-md p-1" style="background: {L ? '#fff' : '#1c1917'}">
						<span class="h-1 w-2/3 rounded-full" style="background: {L ? '#d6d3d1' : '#44403c'}"></span>
						<span class="h-1.5 w-1/2 rounded-full {i === 1 ? 'bg-brand-500' : 'bg-brand-300'}"></span>
					</span>
				{/each}
			</span>
		</span>
	</span>
{/snippet}

<style>
	.step {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		border-radius: 9999px;
		background: var(--color-brand-500);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 600;
	}
	/* sampul profil: gradasi lembut warna brand */
	.hero {
		background:
			radial-gradient(120% 140% at 0% 0%, var(--color-brand-300) 0%, transparent 55%),
			radial-gradient(120% 160% at 100% 0%, var(--color-brand-200) 0%, transparent 60%),
			linear-gradient(135deg, var(--color-brand-100), var(--color-brand-200));
	}
	:global(.dark) .hero {
		background:
			radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, var(--color-brand-500) 45%, transparent) 0%, transparent 60%),
			radial-gradient(120% 160% at 100% 0%, color-mix(in oklab, var(--color-brand-700) 50%, transparent) 0%, transparent 65%),
			linear-gradient(135deg, var(--color-brand-900), var(--color-brand-950));
	}
	.split {
		clip-path: polygon(58% 0, 100% 0, 100% 100%, 42% 100%);
	}
	/* fokus keyboard pada pilihan radio yang disembunyikan */
	.choice:has(:focus-visible) > span:not(.sr-only) {
		outline: 2px solid var(--color-brand-400);
		outline-offset: 2px;
	}
</style>
