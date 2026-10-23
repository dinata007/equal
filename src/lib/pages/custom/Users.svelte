<script lang="ts">
	import { tooltip } from '#lib/ui/tooltip.ts';
	import CopyAccessSheet from '#lib/components/CopyAccessSheet.svelte';
	import { formNav } from '#lib/ui/formNav.ts';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowLeft, Ban, Check, CircleCheck, Copy, KeyRound, Lock, Plus, RefreshCw, Save, ShieldCheck, Tags, Undo2 } from '@lucide/svelte';
	import { api, ApiError } from '#lib/erp/api.ts';
	import { accessLabel, auth, menusOf } from '#lib/erp/auth.svelte.ts';
	import { initials } from '#lib/erp/format.ts';
	import { GRANTABLE, type Leaf } from '#lib/erp/menu.ts';
	import type { ManagedUser } from '#lib/erp/types.ts';
	import { toast } from '#lib/erp/ui.svelte.ts';
	import AccessMatrix from '#lib/components/AccessMatrix.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Select from '#lib/components/Select.svelte';
	import Sheet from '#lib/components/Sheet.svelte';
	import Switch from '#lib/components/Switch.svelte';
	import type { BulkAction, Col } from '#lib/components/types.ts';

	let { leaf }: { leaf: Leaf } = $props();

	type Option = { id: string; name: string; active: boolean };
	const docId = $derived(page.url.searchParams.get('id'));

	/* ---------------- data dari server ---------------- */
	let users = $state<ManagedUser[]>([]);
	let brands = $state<Option[]>([]);
	let stores = $state<Option[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	async function load() {
		loading = true;
		try {
			const r = await api<{ users: ManagedUser[]; brands: Option[]; stores: Option[] }>('/api/users');
			users = r.users;
			brands = r.brands;
			stores = r.stores;
			loadError = '';
		} catch (e) {
			loadError = e instanceof ApiError ? e.message : 'Gagal memuat pengguna';
		}
		loading = false;
	}
	load();

	const storeName = (u: Pick<ManagedUser, 'storeId'>) => (u.storeId ? (stores.find((s) => s.id === u.storeId)?.name ?? u.storeId) : '');
	const status = (u: ManagedUser) =>
		!u.active ? 'Nonaktif' : u.locked ? 'Terkunci' : !u.hasPassword ? 'Belum ada password' : u.mustChange ? 'Password sementara' : 'Aktif';
	const statusCls: Record<string, string> = {
		Aktif: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
		Nonaktif: 'bg-stone-100 text-stone-500 dark:bg-stone-800',
		Terkunci: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
		'Belum ada password': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
		'Password sementara': 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'
	};
	const lastLogin = (u: ManagedUser) => (u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '');

	/* ---------------- daftar ---------------- */
	let query = $state('');
	const columns: Col<ManagedUser>[] = [
		{ key: 'username', label: 'Username', class: 'font-mono text-xs' },
		{ key: 'name', label: 'Nama' },
		{ key: 'store', label: 'Toko', value: (u) => storeName(u) },
		{ key: 'access', label: 'Hak Akses', value: (u) => accessLabel(u), cell: accessCell },
		{ key: 'status', label: 'Status', value: status, cell: statusCell },
		{ key: 'lastLogin', label: 'Login Terakhir', value: (u) => u.lastLoginAt ?? '', format: (v: string) => (v ? new Date(v).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '') }
	];

	const bulk: BulkAction<ManagedUser>[] = [
		{ label: 'Aktifkan', icon: CircleCheck, when: (u) => !u.active, run: (us) => setActive(us, true) },
		{ label: 'Nonaktifkan', icon: Ban, when: (u) => u.active && u.id !== auth.user?.id, run: (us) => setActive(us, false) },
		{ label: 'Buat password sementara', icon: KeyRound, when: (u) => u.id !== auth.user?.id, run: (us) => resetPasswords(us) }
	];
	async function setActive(us: ManagedUser[], active: boolean) {
		try {
			const r = await api<{ count: number }>('/api/users/actions', { body: { action: active ? 'activate' : 'deactivate', ids: us.map((u) => u.id) } });
			toast.success(`${r.count} pengguna ${active ? 'diaktifkan' : 'dinonaktifkan'}`);
			await load();
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan');
			return false;
		}
	}

	/* ---------------- password sementara (ditampilkan sekali) ---------------- */
	let issued = $state<{ username: string; name: string; password: string }[]>([]);
	let issuedOpen = $state(false);
	async function resetPasswords(us: ManagedUser[]) {
		try {
			const r = await api<{ passwords: typeof issued }>('/api/users/actions', { body: { action: 'reset-password', ids: us.map((u) => u.id) } });
			issued = r.passwords;
			issuedOpen = true;
			await load();
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal membuat password');
			return false;
		}
	}
	async function copy(text: string, what = 'Disalin') {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(what);
		} catch {
			toast.error('Tidak bisa menyalin otomatis — salin manual');
		}
	}

	/* ---------------- form ---------------- */
	type Form = { id: number; username: string; name: string; admin: boolean; on: Record<string, boolean>; allBrands: boolean; brands: Record<string, boolean>; storeId: string; active: boolean };
	const leafMap = (u?: ManagedUser) => {
		const on = new Set(u ? menusOf({ ...u, admin: false }) : []);
		return Object.fromEntries(GRANTABLE.map((l) => [l.path, on.has(l.path)]));
	};
	const blank = (): Form => ({ id: 0, username: '', name: '', admin: false, on: leafMap(), allBrands: true, brands: {}, storeId: '', active: true });
	let form = $state<Form>(blank());
	let current = $state<ManagedUser | null>(null);
	let copyOpen = $state(false);
	let saving = $state(false);
	let saveBtn = $state<HTMLButtonElement>();
	let undo = $state<{ from: string; on: Record<string, boolean> } | null>(null);

	$effect(() => {
		const id = docId;
		if (!id || loading) return;
		const u = id === 'new' ? undefined : users.find((x) => String(x.id) === id);
		current = u ?? null;
		form = u
			? {
					id: u.id,
					username: u.username,
					name: u.name,
					admin: u.admin,
					on: leafMap(u),
					allBrands: u.admin || u.brands.includes('*'),
					brands: Object.fromEntries(u.brands.filter((b) => b !== '*').map((b) => [b, true])),
					storeId: u.storeId ?? '',
					active: u.active
				}
			: blank();
		undo = null;
	});

	const total = $derived(Object.values(form.on).filter(Boolean).length);
	const self = $derived(!!form.id && form.id === auth.user?.id);
	const brandCount = $derived(Object.values(form.brands).filter(Boolean).length);

	// flag admin sengaja tidak ikut tersalin; dari admin = semua menu non-admin aktif
	function applyCopy(next: Record<string, boolean>, src: ManagedUser) {
		undo = { from: src.name, on: $state.snapshot(form.on) };
		form.on = next;
		toast.info(`Hak akses disalin dari ${src.name}`);
	}
	function undoCopy() {
		if (undo) form.on = undo.on;
		undo = null;
	}

	async function save() {
		if (!form.name.trim()) return toast.error('Nama wajib diisi');
		if (!/^[A-Za-z0-9._-]{3,30}$/.test(form.username.trim())) return toast.error('Username 3–30 karakter: huruf, angka, titik, minus, atau garis bawah');
		if (!form.admin && !form.allBrands && !brandCount && brands.length) return toast.error('Pilih minimal satu brand, atau aktifkan "Semua brand"');
		const payload = {
			username: form.username.trim(),
			name: form.name.trim(),
			admin: form.admin,
			active: form.active,
			storeId: form.storeId || null,
			menus: Object.entries(form.on).filter(([, v]) => v).map(([p]) => p),
			brands: form.allBrands ? ['*'] : Object.entries(form.brands).filter(([, v]) => v).map(([b]) => b)
		};
		saving = true;
		try {
			if (form.id) {
				await api(`/api/users/${form.id}`, { method: 'PUT', body: payload });
				toast.success('Pengguna disimpan');
			} else {
				const r = await api<{ id: number; tempPassword: string }>('/api/users', { body: payload });
				issued = [{ username: payload.username, name: payload.name, password: r.tempPassword }];
				issuedOpen = true;
			}
			await load();
			goto(leaf.path);
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan');
		}
		saving = false;
	}
</script>

{#snippet accessCell(u: ManagedUser)}
	<span class="badge {u.admin ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}">{accessLabel(u)}</span>
{/snippet}
{#snippet statusCell(u: ManagedUser)}
	{@const s = status(u)}
	<span class="badge {statusCls[s]}">{#if s === 'Terkunci'}<Lock class="size-3" />{/if}{s}</span>
{/snippet}
{#snippet card(u: ManagedUser)}
	<div class="flex items-center gap-3">
		<span class="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-semibold text-white {u.active ? '' : 'opacity-40'}">{initials(u.name)}</span>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{u.name} <span class="font-normal text-stone-400">@{u.username}</span></p>
			<p class="truncate text-xs text-stone-500">{accessLabel(u)}{u.storeId ? ' · ' + storeName(u) : ''}</p>
		</div>
		{#if status(u) !== 'Aktif'}<span class="badge {statusCls[status(u)]}">{status(u)}</span>{/if}
	</div>
{/snippet}

{#if loadError}
	<div class="grid place-items-center py-24 text-center">
		<p class="font-medium">Gagal memuat pengguna</p>
		<p class="mt-1 text-sm text-stone-500">{loadError}</p>
		<button class="btn btn-secondary mt-6" onclick={load}><RefreshCw class="size-4" /> Coba lagi</button>
	</div>
{:else if !docId}
	<PageHeader title={leaf.label} subtitle="{users.length} pengguna · atur menu yang boleh dibuka tiap pengguna" icon={leaf.icon}>
		{#snippet actions()}
			<a href="{leaf.path}?id=new" class="btn btn-primary hidden sm:inline-flex"><Plus class="size-4" /> Tambah</a>
		{/snippet}
	</PageHeader>
	<div class="card overflow-clip {loading ? 'opacity-60' : ''}">
		<DataTable rows={users} {columns} bind:query {card} {bulk} searchPlaceholder="Cari nama / username…" exportName="Pengguna" onrow={(u) => goto(`${leaf.path}?id=${u.id}`)} initialSort={{ key: 'name', dir: 1 }} empty={loading ? 'Memuat…' : 'Belum ada pengguna'} />
	</div>
	<a href="{leaf.path}?id=new" class="btn btn-primary fixed right-4 bottom-24 z-20 size-11 rounded-xl p-0 shadow-lg shadow-stone-900/20 sm:hidden" aria-label="Tambah pengguna"><Plus class="size-5" /></a>
{:else if !loading && docId !== 'new' && !current}
	<div class="grid place-items-center py-24 text-center">
		<p class="font-medium">Pengguna tidak ditemukan</p>
		<a href={leaf.path} class="btn btn-secondary mt-6"><ArrowLeft class="size-4" /> Daftar pengguna</a>
	</div>
{:else}
	<div class="mb-4 flex items-center gap-3">
		<a href={leaf.path} class="btn btn-secondary btn-icon" aria-label="Kembali" {@attach tooltip()}><ArrowLeft class="size-4" /></a>
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="truncate text-xl font-medium">{form.id ? form.name : 'Pengguna Baru'}</h1>
				{#if current}{@render statusCell(current)}{/if}
			</div>
			<p class="truncate text-sm text-stone-500">
				{#if current}@{current.username}{current.legacyId ? ` · dari aplikasi lama (${current.legacyId})` : ''}{current.lastLoginAt ? ` · login terakhir ${lastLogin(current)}` : ''}
				{:else}Password sementara dibuat otomatis saat disimpan{/if}
			</p>
		</div>
	</div>

	<div class="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
		<!-- data akun -->
		<div class="h-fit space-y-4">
			<div class="card space-y-3 p-4" {@attach formNav({ onsave: () => save(), last: () => saveBtn })}>
				<div><label class="label" for="u-name">Nama Lengkap <span class="text-rose-500">*</span></label><input id="u-name" class="input" bind:value={form.name} maxlength="80" /></div>
				<div><label class="label" for="u-user">Username <span class="text-rose-500">*</span></label><input id="u-user" class="input" bind:value={form.username} autocapitalize="none" autocomplete="off" maxlength="30" /></div>
				<div>
					<label class="label" for="u-store">Toko default <span class="font-normal text-stone-400">(opsional)</span></label>
					<Select id="u-store" bind:value={form.storeId} options={[{ value: '', label: 'Tidak terikat toko' }, ...stores.map((s) => ({ value: s.id, label: s.name, hint: s.id + (s.active ? '' : ' · nonaktif') }))]} label="Toko default" searchable />
				</div>
				<div class="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2.5 dark:border-stone-700">
					<span class="text-sm">Akun aktif</span>
					<Switch label="Akun aktif" checked={form.active} disabled={self} onchange={(v) => (form.active = v)} />
				</div>
				{#if current && !self}
					<button type="button" class="btn btn-secondary w-full" onclick={() => resetPasswords([current!])}><KeyRound class="size-4" /> Buat password sementara</button>
				{/if}
			</div>

			{#if !form.admin}
				<!-- cakupan brand -->
				<div class="card divide-y divide-stone-100 dark:divide-stone-800">
					<div class="flex items-center gap-3 px-4 py-3">
						<Tags class="size-5 shrink-0 text-brand-500" />
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium">Semua brand</p>
							<p class="text-xs text-stone-500">{form.allBrands ? 'Termasuk brand baru nanti' : `${brandCount} brand dipilih`}</p>
						</div>
						<Switch label="Semua brand" checked={form.allBrands} onchange={(v) => (form.allBrands = v)} />
					</div>
					{#if !form.allBrands}
						<ul class="py-1">
							{#each brands as b (b.id)}
								<li>
									<label class="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800/40">
										<span class="w-6 font-mono text-xs text-stone-400">{b.id}</span>
										<span class="min-w-0 flex-1 truncate text-sm {b.active ? '' : 'text-stone-400'}">{b.name}{b.active ? '' : ' (nonaktif)'}</span>
										<Switch label={b.name} checked={!!form.brands[b.id]} onchange={(v) => (form.brands[b.id] = v)} />
									</label>
								</li>
							{:else}
								<li class="px-4 py-3 text-sm text-stone-400">Belum ada data brand (M_PRODUK_BRAND)</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</div>

		<!-- hak akses -->
		<div class="min-w-0 space-y-3">
			<div class="card divide-y divide-stone-100 dark:divide-stone-800">
				<div class="flex items-center gap-3 px-4 py-3">
					<KeyRound class="size-5 shrink-0 text-brand-500" />
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium">Admin</p>
						<p class="text-xs text-stone-500">Akses penuh ke semua menu & brand, termasuk mengelola pengguna</p>
					</div>
					<Switch label="Admin" checked={form.admin} disabled={self} onchange={(v) => (form.admin = v)} />
				</div>
				{#if !form.admin}
					<div class="flex items-center gap-3 px-4 py-3">
						<Copy class="size-5 shrink-0 text-brand-500" />
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium">Salin akses</p>
							{#if undo}
								<p class="truncate text-xs text-stone-500">Disalin dari <b class="font-medium text-stone-700 dark:text-stone-300">{undo.from}</b> · belum disimpan</p>
							{:else}
								<p class="truncate text-xs text-stone-500">Jadikan akses pengguna lain sebagai acuan</p>
							{/if}
						</div>
						{#if undo}
							<button type="button" class="btn btn-ghost btn-sm" onclick={undoCopy}><Undo2 class="size-3.5" /> Urungkan</button>
						{/if}
						<button type="button" class="btn btn-secondary btn-sm" onclick={() => (copyOpen = true)}>Pilih pengguna…</button>
					</div>
				{/if}
			</div>

			{#if form.admin}
				<div class="card flex items-center gap-3 p-4 text-sm text-stone-600 dark:text-stone-300">
					<ShieldCheck class="size-5 shrink-0 text-brand-500" />
					Admin otomatis bisa membuka semua menu, termasuk menu baru nanti — tidak perlu diatur.
				</div>
			{:else}
				<p class="px-1 text-xs text-stone-500"><b class="text-stone-700 dark:text-stone-300">{total}</b> dari {GRANTABLE.length} menu aktif</p>
				{#key docId}
					<AccessMatrix isOn={(p) => form.on[p]} onset={(paths, v) => paths.forEach((p) => (form.on[p] = v))} />
				{/key}
			{/if}
		</div>
	</div>

	<div class="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 mt-4 lg:bottom-4">
		<div class="card flex items-center gap-2 p-2 shadow-lg">
			<div class="flex-1"></div>
			<a href={leaf.path} class="btn btn-secondary">Batal</a>
			<button bind:this={saveBtn} class="btn btn-primary" onclick={save} disabled={saving} {@attach tooltip('Simpan', { kbd: 'Ctrl S' })}><Save class="size-4" /> Simpan</button>
		</div>
	</div>

	<CopyAccessSheet bind:open={copyOpen} users={users.filter((u) => u.id !== form.id)} current={form.on} {storeName} onapply={applyCopy} />
{/if}

<!-- password sementara: hanya tampil sekali, server hanya menyimpan hash-nya -->
<Sheet bind:open={issuedOpen} title="Password sementara" subtitle="Hanya ditampilkan sekali — berikan ke pengguna sekarang">
	<p class="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
		Pengguna wajib mengganti password ini saat login pertama. Setelah jendela ini ditutup, password tidak bisa dilihat lagi (buat ulang bila lupa).
	</p>
	<ul class="divide-y divide-stone-100 dark:divide-stone-800">
		{#each issued as p (p.username)}
			<li class="flex items-center gap-3 py-2.5">
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{p.name}</p>
					<p class="truncate text-xs text-stone-500">@{p.username}</p>
				</div>
				<code class="rounded-lg bg-stone-100 px-2.5 py-1 font-mono text-sm tracking-wide select-all dark:bg-stone-800">{p.password}</code>
				<button class="btn btn-ghost btn-icon btn-sm" onclick={() => copy(p.password, `Password ${p.username} disalin`)} aria-label="Salin password {p.username}" {@attach tooltip()}><Copy class="size-3.5" /></button>
			</li>
		{/each}
	</ul>
	{#snippet footer()}
		{#if issued.length > 1}
			<button class="btn btn-secondary" onclick={() => copy(issued.map((p) => `${p.username}\t${p.password}`).join('\n'), 'Semua password disalin')}><Copy class="size-4" /> Salin semua</button>
		{/if}
		<div class="flex-1"></div>
		<button class="btn btn-primary" onclick={() => (issuedOpen = false)}><Check class="size-4" /> Sudah dicatat</button>
	{/snippet}
</Sheet>
