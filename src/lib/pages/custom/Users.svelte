<script lang="ts">
	import { tooltip } from '#lib/ui/tooltip.ts';
	import CopyAccessSheet from '#lib/components/CopyAccessSheet.svelte';
	import { formNav } from '#lib/ui/formNav.ts';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowLeft, Ban, CircleCheck, Copy, Eye, EyeOff, KeyRound, Plus, Save, ShieldCheck, Trash, Undo2 } from '@lucide/svelte';
	import { accessLabel, auth, userOn } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { initials } from '#lib/erp/format.ts';
	import { GRANTABLE, type Leaf } from '#lib/erp/menu.ts';
	import type { User } from '#lib/erp/types.ts';
	import { ask, toast } from '#lib/erp/ui.svelte.ts';
	import AccessMatrix from '#lib/components/AccessMatrix.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import Lookup from '#lib/components/Lookup.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Switch from '#lib/components/Switch.svelte';
	import type { BulkAction, Col } from '#lib/components/types.ts';

	let { leaf }: { leaf: Leaf } = $props();

	const can = $derived({ create: auth.can(leaf.path, 'create'), edit: auth.can(leaf.path, 'edit'), delete: auth.can(leaf.path, 'delete') });
	const docId = $derived(page.url.searchParams.get('id'));
	const users = $derived(db.all<User>('users'));

	/* ---------------- daftar ---------------- */
	let query = $state('');
	const columns: Col<User>[] = [
		{ key: 'username', label: 'Username', class: 'font-mono text-xs' },
		{ key: 'name', label: 'Nama' },
		{ key: 'store', label: 'Toko', value: (u) => db.name('stores', u.storeId) },
		{ key: 'access', label: 'Hak Akses', value: (u) => accessLabel(u), cell: accessCell },
		{ key: 'active', label: 'Status', align: 'center', value: (u) => (u.active ? 'Aktif' : 'Nonaktif'), cell: activeCell }
	];

	const bulk = $derived<BulkAction<User>[]>(
		can.edit
			? [
					{ label: 'Aktifkan', icon: CircleCheck, when: (u) => !u.active, run: (us) => setActive(us, true) },
					{ label: 'Nonaktifkan', icon: Ban, when: (u) => u.active && u.id !== auth.user?.id, run: (us) => setActive(us, false) }
				]
			: []
	);
	async function setActive(us: User[], active: boolean) {
		if (!active && !users.some((u) => u.admin && u.active && !us.includes(u))) {
			toast.error('Minimal harus ada satu admin aktif');
			return false;
		}
		for (const u of us) await db.update('users', u.id, { active });
		toast.success(`${us.length} pengguna ${active ? 'diaktifkan' : 'dinonaktifkan'}`);
	}

	/* ---------------- form ---------------- */
	type Form = { id: string; username: string; name: string; password: string; admin: boolean; on: Record<string, boolean>; storeId: string; active: boolean };
	const leafMap = (u?: User) => Object.fromEntries(GRANTABLE.map((l) => [l.path, !!u && userOn({ ...u, admin: false }, l.path)]));
	const blank = (): Form => ({ id: '', username: '', name: '', password: '', admin: false, on: leafMap(), storeId: '', active: true });
	let form = $state<Form>(blank());
	let showPass = $state(false);
	let copyOpen = $state(false);
	let saveBtn = $state<HTMLButtonElement>();
	let undo = $state<{ from: string; on: Record<string, boolean> } | null>(null);

	$effect(() => {
		const id = docId;
		if (!id) return;
		const u = id === 'new' ? undefined : db.get<User>('users', id);
		form = u
			? { id: u.id, username: u.username, name: u.name, password: u.password, admin: !!u.admin, on: leafMap(u), storeId: u.storeId ?? '', active: u.active }
			: blank();
		showPass = false;
		undo = null;
	});

	const total = $derived(Object.values(form.on).filter(Boolean).length);
	const editable = $derived(form.id ? can.edit : can.create);

	// flag admin sengaja tidak ikut tersalin; dari admin = semua menu non-admin aktif
	function applyCopy(next: Record<string, boolean>, src: User) {
		undo = { from: src.name, on: $state.snapshot(form.on) };
		form.on = next;
		toast.info(`Hak akses disalin dari ${src.name}`);
	}
	function undoCopy() {
		if (undo) form.on = undo.on;
		undo = null;
	}

	async function save() {
		if (!form.username.trim() || !form.name.trim()) return toast.error('Username dan nama wajib diisi');
		if (!form.password) return toast.error('Password wajib diisi');
		if (users.some((u) => u.id !== form.id && u.username.toLowerCase() === form.username.trim().toLowerCase())) return toast.error(`Username "${form.username}" sudah dipakai`);
		if (form.id === auth.user?.id && !form.admin) return toast.error('Flag admin tidak bisa dicabut dari akun Anda sendiri');
		if (form.id === auth.user?.id && !form.active) return toast.error('Akun yang sedang dipakai tidak bisa dinonaktifkan');
		if (!users.some((u) => u.id !== form.id && u.admin && u.active) && !(form.admin && form.active)) return toast.error('Minimal harus ada satu admin aktif');
		const access = Object.fromEntries(Object.entries(form.on).filter(([, v]) => v).map(([p]) => [p, true]));
		const data = { username: form.username.trim(), name: form.name.trim(), password: form.password, admin: form.admin, access, storeId: form.storeId, active: form.active };
		if (form.id) await db.update('users', form.id, data);
		else await db.insert('users', data);
		toast.success('Pengguna disimpan');
		goto(leaf.path);
	}
	async function remove() {
		if (form.id === auth.user?.id) return toast.error('Tidak bisa menghapus akun yang sedang dipakai');
		if (form.admin && !users.some((u) => u.id !== form.id && u.admin && u.active)) return toast.error('Admin terakhir tidak bisa dihapus');
		if (!(await ask({ title: `Hapus pengguna ${form.name}?`, message: 'Gunakan "nonaktif" jika ingin menyimpan riwayatnya.', danger: true, confirmText: 'Hapus' }))) return;
		await db.remove('users', form.id);
		toast.success('Pengguna dihapus');
		goto(leaf.path);
	}
</script>

{#snippet accessCell(u: User)}
	<span class="badge {u.admin ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}">{accessLabel(u)}</span>
{/snippet}
{#snippet activeCell(u: User)}
	<span class="badge {u.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}">{u.active ? 'Aktif' : 'Nonaktif'}</span>
{/snippet}
{#snippet card(u: User)}
	<div class="flex items-center gap-3">
		<span class="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-semibold text-white {u.active ? '' : 'opacity-40'}">{initials(u.name)}</span>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{u.name} <span class="font-normal text-stone-400">@{u.username}</span></p>
			<p class="truncate text-xs text-stone-500">{accessLabel(u)}{u.storeId ? ' · ' + db.name('stores', u.storeId) : ''}</p>
		</div>
		{#if !u.active}<span class="badge bg-stone-100 text-stone-500 dark:bg-stone-800">Nonaktif</span>{/if}
	</div>
{/snippet}

{#if !docId}
	<PageHeader title={leaf.label} subtitle="{users.length} pengguna · atur menu yang boleh dibuka tiap pengguna" icon={leaf.icon}>
		{#snippet actions()}
			{#if can.create}<a href="{leaf.path}?id=new" class="btn btn-primary hidden sm:inline-flex"><Plus class="size-4" /> Tambah</a>{/if}
		{/snippet}
	</PageHeader>
	<div class="card overflow-clip">
		<DataTable rows={users} {columns} bind:query {card} {bulk} searchPlaceholder="Cari nama / username…" exportName="Pengguna" onrow={(u) => goto(`${leaf.path}?id=${u.id}`)} initialSort={{ key: 'name', dir: 1 }} />
	</div>
	{#if can.create}
		<a href="{leaf.path}?id=new" class="btn btn-primary fixed right-4 bottom-24 z-20 size-11 rounded-xl p-0 shadow-lg shadow-stone-900/20 sm:hidden" aria-label="Tambah pengguna"><Plus class="size-5" /></a>
	{/if}
{:else}
	<div class="mb-4 flex items-center gap-3">
		<a href={leaf.path} class="btn btn-secondary btn-icon" aria-label="Kembali" {@attach tooltip()}><ArrowLeft class="size-4" /></a>
		<div class="min-w-0 flex-1">
			<h1 class="truncate text-xl font-medium">{form.id ? form.name : 'Pengguna Baru'}</h1>
			<p class="truncate text-sm text-stone-500">{form.id ? '@' + form.username : 'Isi data akun & pilih menu yang boleh dibuka'}</p>
		</div>
	</div>

	<div class="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
		<!-- data akun -->
		<div class="card h-fit space-y-3 p-4" {@attach formNav({ onsave: () => editable && save(), last: () => saveBtn })}>
			<div><label class="label" for="u-name">Nama Lengkap <span class="text-rose-500">*</span></label><input id="u-name" class="input" bind:value={form.name} disabled={!editable} /></div>
			<div class="grid grid-cols-2 gap-3">
				<div><label class="label" for="u-user">Username <span class="text-rose-500">*</span></label><input id="u-user" class="input" bind:value={form.username} disabled={!editable} autocapitalize="none" autocomplete="off" /></div>
				<div>
					<label class="label" for="u-pass">Password <span class="text-rose-500">*</span></label>
					<div class="relative">
						<input id="u-pass" class="input pr-10" type={showPass ? 'text' : 'password'} bind:value={form.password} disabled={!editable} autocomplete="new-password" />
						<button type="button" class="absolute inset-y-0 right-0 grid w-10 place-items-center text-stone-400" onclick={() => (showPass = !showPass)} aria-label="Tampilkan password">
							{#if showPass}<EyeOff class="size-4" />{:else}<Eye class="size-4" />{/if}
						</button>
					</div>
				</div>
			</div>
			<div><span class="label">Toko default <span class="font-normal text-stone-400">(opsional)</span></span><Lookup table="stores" bind:value={form.storeId} clearable disabled={!editable} placeholder="Tidak terikat toko" /></div>
			<div class="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2.5 dark:border-stone-700">
				<span class="text-sm">Akun aktif</span>
				<Switch label="Akun aktif" checked={form.active} disabled={!editable || form.id === auth.user?.id} onchange={(v) => (form.active = v)} />
			</div>
		</div>

		<!-- hak akses -->
		<div class="min-w-0 space-y-3">
			<div class="card divide-y divide-stone-100 dark:divide-stone-800">
				<div class="flex items-center gap-3 px-4 py-3">
					<KeyRound class="size-5 shrink-0 text-brand-500" />
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium">Admin</p>
						<p class="text-xs text-stone-500">Akses penuh ke semua menu, termasuk mengelola pengguna</p>
					</div>
					<Switch label="Admin" checked={form.admin} disabled={!editable || form.id === auth.user?.id} onchange={(v) => (form.admin = v)} />
				</div>
				{#if editable && !form.admin}
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
					<AccessMatrix isOn={(p) => form.on[p]} onset={(paths, v) => paths.forEach((p) => (form.on[p] = v))} disabled={!editable} />
				{/key}
			{/if}
		</div>
	</div>

	<div class="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 mt-4 lg:bottom-4">
		<div class="card flex items-center gap-2 p-2 shadow-lg">
			{#if form.id && can.delete}
				<button class="btn btn-ghost text-rose-600" onclick={remove}><Trash class="size-4" /><span class="hidden sm:inline">Hapus</span></button>
			{/if}
			<div class="flex-1"></div>
			<a href={leaf.path} class="btn btn-secondary">Batal</a>
			{#if editable}<button bind:this={saveBtn} class="btn btn-primary" onclick={save} {@attach tooltip('Simpan', { kbd: 'Ctrl S' })}><Save class="size-4" /> Simpan</button>{/if}
		</div>
	</div>

	<CopyAccessSheet bind:open={copyOpen} users={users.filter((u) => u.id !== form.id)} current={form.on} onapply={applyCopy} />
{/if}
