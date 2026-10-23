<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { Ban, CircleCheck, Copy, Download, Plus, RotateCw, Trash, TriangleAlert } from '@lucide/svelte';
	import { ApiError, api } from '#lib/erp/api.ts';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { downloadCsv, num, rp, today } from '#lib/erp/format.ts';
	import { lookups } from '#lib/erp/lookups.svelte.ts';
	import type { Leaf } from '#lib/erp/menu.ts';
	import type { FieldDef, MasterDef, Row } from '#lib/erp/types.ts';
	import { ask, toast } from '#lib/erp/ui.svelte.ts';
	import DataTable from '#lib/components/DataTable.svelte';
	import Field from '#lib/components/Field.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Sheet from '#lib/components/Sheet.svelte';
	import type { BulkAction, Col } from '#lib/components/types.ts';
	import { fields, formNav } from '#lib/ui/formNav.ts';
	import { tooltip } from '#lib/ui/tooltip.ts';

	let {
		leaf,
		page: pageDef,
		label: pageLabel,
		nav,
		tabs = []
	}: {
		leaf: Leaf;
		/** definisi master lain di bawah menu yang sama (halaman bertab); default = halaman menu */
		page?: MasterDef;
		/** nama data untuk judul form & pesan; default = label menu */
		label?: string;
		/** navigasi tambahan di bawah judul (tab) */
		nav?: Snippet;
		/** tab tambahan di form ubah (data terkait baris ini, mis. kontrak pegawai); `reload` memuat ulang baris */
		tabs?: { key: string; label: string; panel: Snippet<[Row, () => Promise<void>]> }[];
	} = $props();

	const def = $derived(pageDef ?? (leaf.page as MasterDef));
	const label = $derived(pageLabel ?? leaf.label);
	/** master dari database (tabel lama) — selain itu data prototipe di browser */
	const remote = $derived(!!def.resource);
	const codeKey = $derived(def.codeField ?? 'code');
	const activeKey = $derived(def.activeField ?? 'active');
	const can = $derived({
		create: auth.can(leaf.path, 'create'),
		edit: auth.can(leaf.path, 'edit'),
		delete: auth.can(leaf.path, 'delete')
	});

	/* ---------------- data ---------------- */
	let remoteRows = $state<Row[]>([]);
	let loading = $state(false);
	let loadError = $state('');
	const rows = $derived(remote ? remoteRows : db.all(def.table!));
	const url = $derived(`/api/master/${def.resource}`);

	async function load() {
		loading = true;
		loadError = '';
		try {
			remoteRows = (await api<{ rows: Row[] }>(url)).rows;
		} catch (e) {
			loadError = e instanceof ApiError ? e.message : 'Gagal memuat data';
		} finally {
			loading = false;
		}
	}
	$effect(() => {
		if (!remote) return;
		void url;
		remoteRows = [];
		void load();
	});

	let query = $state('');
	let open = $state(false);
	let form = $state<Record<string, any>>({});
	let editing = $state<Row | null>(null);
	let errors = $state<Record<string, string>>({});
	let saving = $state(false);
	let formEl = $state<HTMLFormElement>();
	let saveBtn = $state<HTMLButtonElement>();
	const canSave = $derived(editing ? can.edit : can.create);

	// form dibuka → fokus ke isian pertama (desktop; di HP tidak memunculkan keyboard tiba-tiba)
	$effect(() => {
		if (!open || matchMedia('(pointer: coarse)').matches) return;
		requestAnimationFrame(() => fields(formEl!)[0]?.focus());
	});

	const optionLabel = (f: FieldDef, v: unknown) => {
		const o = f.options?.find((x) => (typeof x === 'string' ? x : x.value) === v);
		return o == null ? (v ?? '') : typeof o === 'string' ? o : o.label;
	};

	function display(f: FieldDef, r: Row) {
		const v = r[f.key];
		if (f.type === 'lookup') return f.source ? (v ? lookups.name(f.source, v) : '') : db.name(f.ref!, v);
		if (f.type === 'select') return optionLabel(f, v);
		if (f.type === 'money') return v ? rp(v) : '';
		if (f.type === 'toggle') return f.key === activeKey ? (v ? 'Aktif' : 'Nonaktif') : v ? 'Ya' : 'Tidak';
		if (f.type === 'password') return '••••••';
		return v ?? '';
	}

	const columns = $derived<Col<Row>[]>(
		def.fields
			.filter((f) => f.list)
			.map((f) => ({
				key: f.key,
				label: f.label,
				align: f.type === 'money' || f.type === 'number' ? 'right' : f.type === 'toggle' ? 'center' : undefined,
				value: (r: Row) => (f.type === 'money' || f.type === 'number' ? Number(r[f.key]) || 0 : display(f, r)),
				format: f.type === 'money' ? (v: number) => (v ? rp(v) : '') : f.type === 'number' ? (v: number) => num(v) : undefined,
				cell: f.type === 'toggle' && f.key === activeKey ? activeCell : f.key === codeKey ? codeCell : undefined
			}))
	);
	const fTitle = $derived(def.fields.find((f) => f.mobile === 'title'));
	const fSub = $derived(def.fields.find((f) => f.mobile === 'subtitle'));
	const fMeta = $derived(def.fields.find((f) => f.mobile === 'meta'));
	const hasActive = $derived(def.fields.some((f) => f.key === activeKey && f.type === 'toggle'));

	const rowLabel = (r: Row) => (remote ? [r[codeKey], r[def.nameField ?? 'name']].filter(Boolean).join(' — ') : db.label(def.table!, r.id));

	/** isian form: kode otomatis & kunci tabel lama tidak bisa diubah setelah tersimpan */
	const locked = (f: FieldDef) => (editing ? !!f.lockOnEdit : !!f.auto);
	/** petunjuk isian hanya untuk kolom yang masih bisa diisi (kolom terkunci saat ubah tanpa petunjuk) */
	const formField = (f: FieldDef): FieldDef =>
		f.auto && !editing ? { ...f, placeholder: 'Otomatis saat disimpan', required: false } : editing && f.lockOnEdit ? { ...f, hint: undefined } : f;

	/** isian turunan (def.derive) hanya bereaksi pada perubahan oleh pengguna, bukan saat data dibuka */
	let seen: Record<string, any> = {};
	const remember = () => (seen = $state.snapshot(form));
	$effect(() => {
		if (!def.derive || !open) return;
		const cur = $state.snapshot(form);
		untrack(() => {
			const k = Object.keys(cur).find((x) => x in seen && JSON.stringify(cur[x]) !== JSON.stringify(seen[x]));
			if (k) def.derive!(form, k);
			remember();
		});
	});

	function openNew() {
		const ctx = { userStoreId: auth.user?.storeId ?? undefined, today: today() };
		const f: Record<string, any> = {};
		for (const fd of def.fields) f[fd.key] = typeof fd.default === 'function' ? fd.default(ctx) : (fd.default ?? (fd.type === 'toggle' ? false : ''));
		if (!remote && def.fields.some((x) => x.key === codeKey && x.required)) f[codeKey] = db.nextCode(def.table!, codeKey);
		form = f;
		remember();
		editing = null;
		errors = {};
		open = true;
	}
	let opening = $state(false);
	async function openEdit(r: Row) {
		form = $state.snapshot(r) as Record<string, any>;
		remember();
		editing = r;
		errors = {};
		tab = '';
		open = true;
		if (!remote) return;
		// baris terbaru dari database (bisa saja baru diubah aplikasi lama), lengkap dengan semua kolom form
		opening = true;
		try {
			const full = (await api<{ row: Row }>(`${url}?id=${encodeURIComponent(r.id)}`)).row;
			if (editing?.id !== r.id) return;
			editing = full;
			form = $state.snapshot(full) as Record<string, any>;
			remember();
			replaceRow(full);
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal memuat data');
			open = false;
		} finally {
			opening = false;
		}
	}
	let tab = $state('');
	/** baris yang terbuka dimuat ulang dari database (setelah panel tab mengubah data terkait) */
	async function reloadRow() {
		if (!editing) return;
		const full = (await api<{ row: Row }>(`${url}?id=${encodeURIComponent(editing.id)}`)).row;
		editing = full;
		form = $state.snapshot(full) as Record<string, any>;
		remember();
		replaceRow(full);
	}

	/** salin isian data yang terbuka menjadi data baru (kode otomatis dibuat lagi saat simpan) */
	function copyAsNew() {
		const f = $state.snapshot(form) as Record<string, any>;
		for (const fd of def.fields) if (fd.auto) f[fd.key] = '';
		delete f.id;
		form = f;
		remember();
		editing = null;
		errors = {};
		toast.info('Salinan dibuat — periksa isian lalu simpan sebagai data baru');
	}

	function validate() {
		const e: Record<string, string> = {};
		for (const f of def.fields) {
			if ((f.showIf && !f.showIf(form)) || (f.auto && !editing)) continue;
			const v = form[f.key];
			const blank = v === '' || v == null || (typeof v === 'string' && !v.trim());
			if (f.required && blank) e[f.key] = `${f.label} wajib diisi`;
			else if ((f.type === 'number' || f.type === 'money') && +v < 0) e[f.key] = `${f.label} tidak boleh negatif`;
			else if (f.maxLength && typeof v === 'string' && v.trim().length > f.maxLength) e[f.key] = `${f.label} maksimal ${f.maxLength} karakter`;
			else if (!remote && f.unique && !blank && rows.some((r) => r.id !== form.id && String(r[f.key]).toLowerCase() === String(v).toLowerCase()))
				e[f.key] = `${f.label} "${v}" sudah digunakan`;
		}
		errors = e;
		return !Object.keys(e).length;
	}

	function replaceRow(row: Row, oldId?: string) {
		const i = remoteRows.findIndex((r) => r.id === (oldId ?? row.id));
		if (i >= 0) remoteRows[i] = row;
		else remoteRows.unshift(row);
	}

	async function save() {
		if (saving || opening) return;
		if (!validate()) return toast.error('Periksa kembali isian form');
		saving = true;
		try {
			if (remote) {
				const values = $state.snapshot(form);
				// ubah: kirim hanya isian yang diganti pengguna, agar perubahan dari aplikasi lama di kolom lain tidak tertimpa
				if (editing) for (const k of Object.keys(values)) if (JSON.stringify(values[k]) === JSON.stringify(editing[k])) delete values[k];
				const r = editing
					? await api<{ row: Row }>(url, { method: 'PUT', body: { id: editing.id, values } })
					: await api<{ row: Row }>(url, { method: 'POST', body: values });
				replaceRow(r.row, editing?.id);
				lookups.refresh();
				toast.success(`${label} ${editing ? 'diperbarui' : `${r.row[codeKey] ?? ''} ditambahkan`}`);
			} else {
				if (editing) await db.update(def.table!, editing.id, form);
				else await db.insert(def.table!, form);
				toast.success(`${label} ${editing ? 'diperbarui' : 'ditambahkan'}`);
			}
			open = false;
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan');
		} finally {
			saving = false;
		}
	}

	/** prototipe: dipakai di data lain? (master database dicek server saat hapus) */
	function isUsed(id: string) {
		for (const [t, list] of Object.entries(db.t)) {
			if (t === def.table) continue;
			for (const r of list) {
				for (const v of Object.values(r)) if (v === id) return true;
				if (Array.isArray(r.lines) && r.lines.some((l: any) => Object.values(l).includes(id))) return true;
			}
		}
		return false;
	}

	async function removeRemote(r: Row) {
		await api(`${url}?id=${encodeURIComponent(r.id)}`, { method: 'DELETE' });
		remoteRows = remoteRows.filter((x) => x.id !== r.id);
	}

	async function remove() {
		if (!editing) return;
		if (!remote && isUsed(editing.id)) return toast.error('Data sudah dipakai di transaksi/master lain. Nonaktifkan saja.');
		if (!(await ask({ title: 'Hapus data ini?', message: rowLabel(editing), danger: true, confirmText: 'Hapus' }))) return;
		try {
			if (remote) {
				await removeRemote(editing);
				lookups.refresh();
			} else await db.remove(def.table!, editing.id);
			toast.success('Data dihapus');
			open = false;
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus');
		}
	}

	const bulk = $derived<BulkAction<Row>[]>([
		...(can.edit && hasActive
			? [
					{ label: 'Aktifkan', icon: CircleCheck, when: (r: Row) => !r[activeKey], run: (rs: Row[]) => setActive(rs, true) },
					{ label: 'Nonaktifkan', icon: Ban, when: (r: Row) => !!r[activeKey], run: (rs: Row[]) => setActive(rs, false) }
				]
			: []),
		...(can.delete ? [{ label: 'Hapus', icon: Trash, danger: true, run: removeMany }] : [])
	]);
	async function setActive(rs: Row[], active: boolean) {
		try {
			if (remote) {
				await api(url, { method: 'PATCH', body: { ids: rs.map((r) => r.id), active } });
				const ids = new Set(rs.map((r) => r.id));
				for (const r of remoteRows) if (ids.has(r.id)) r[activeKey] = active;
				lookups.refresh();
			} else for (const r of rs) await db.update(def.table!, r.id, { [activeKey]: active });
			toast.success(`${rs.length} data ${active ? 'diaktifkan' : 'dinonaktifkan'}`);
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal mengubah status');
			return false;
		}
	}
	async function removeMany(rs: Row[]) {
		if (remote) return removeManyRemote(rs);
		const free = rs.filter((r) => !isUsed(r.id));
		const used = rs.length - free.length;
		if (!free.length) {
			toast.error('Semua data terpilih sudah dipakai di transaksi/master lain. Nonaktifkan saja.');
			return false;
		}
		const msg = used ? `${used} data lain tidak ikut dihapus karena sudah dipakai.` : 'Tindakan ini tidak bisa dibatalkan.';
		if (!(await ask({ title: `Hapus ${free.length} data?`, message: msg, danger: true, confirmText: 'Hapus' }))) return false;
		for (const r of free) await db.remove(def.table!, r.id);
		toast.success(`${free.length} data dihapus`);
	}
	async function removeManyRemote(rs: Row[]) {
		const msg = 'Data yang sudah dipakai di transaksi tidak ikut dihapus. Tindakan ini tidak bisa dibatalkan.';
		if (!(await ask({ title: `Hapus ${rs.length} data?`, message: msg, danger: true, confirmText: 'Hapus' }))) return false;
		let done = 0;
		let firstError = '';
		for (const r of rs) {
			try {
				await removeRemote(r);
				done++;
			} catch (e) {
				firstError ||= e instanceof ApiError ? e.message : 'Gagal menghapus';
			}
		}
		if (done) lookups.refresh();
		if (done === rs.length) toast.success(`${done} data dihapus`);
		else if (done) toast.error(`${done} data dihapus, ${rs.length - done} tidak bisa dihapus. ${firstError}`);
		else toast.error(rs.length === 1 ? firstError : `Tidak ada yang terhapus. ${firstError}`);
		return done ? undefined : false;
	}

	function exportCsv() {
		const fs = def.fields.filter((f) => f.type !== 'password');
		downloadCsv(label, fs.map((f) => f.label), rows.map((r) => fs.map((f) => (f.type === 'money' || f.type === 'number' ? (r[f.key] ?? '') : display(f, r)))));
	}
</script>

{#snippet activeCell(r: Row)}
	<span class="badge {r[activeKey] ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}">{r[activeKey] ? 'Aktif' : 'Nonaktif'}</span>
{/snippet}
{#snippet codeCell(r: Row)}
	<span class="font-mono text-xs font-medium text-stone-500">{r[codeKey]}</span>
{/snippet}

{#snippet card(r: Row)}
	<div class="flex items-center gap-3">
		<div class="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-xs font-semibold text-stone-500 dark:bg-stone-800">
			{String(fTitle ? r[fTitle.key] : '').slice(0, 2).toUpperCase()}
		</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{fTitle ? display(fTitle, r) : r.id}</p>
			<p class="truncate text-xs text-stone-500">{[fMeta ? display(fMeta, r) : '', fSub ? display(fSub, r) : ''].filter(Boolean).join(' · ')}</p>
		</div>
		{#if hasActive && !r[activeKey]}<span class="badge bg-stone-100 text-stone-500 dark:bg-stone-800">Nonaktif</span>{/if}
	</div>
{/snippet}

<PageHeader title={leaf.label} subtitle="{loading ? 'Memuat…' : `${num(rows.length)} data`} · {leaf.trail.slice(0, -1).join(' › ')}" icon={leaf.icon}>
	{#snippet actions()}
		{#if remote}
			<button class="btn btn-secondary" onclick={load} disabled={loading} aria-label="Muat ulang" {@attach tooltip('Muat ulang dari database')}>
				<RotateCw class="size-4 {loading ? 'animate-spin' : ''}" />
			</button>
		{/if}
		<button class="btn btn-secondary" onclick={exportCsv}><Download class="size-4" /><span class="hidden sm:inline">Export</span></button>
		{#if can.create}<button class="btn btn-primary hidden sm:inline-flex" onclick={openNew}><Plus class="size-4" /> Tambah</button>{/if}
	{/snippet}
</PageHeader>

{#if nav}{@render nav()}{/if}

{#if loadError}
	<div class="card mb-3 flex items-center gap-3 border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
		<TriangleAlert class="size-5 shrink-0" />
		<p class="flex-1">{loadError}</p>
		<button class="btn btn-secondary" onclick={load}>Coba lagi</button>
	</div>
{/if}

<div class="card overflow-clip">
	<DataTable
		{rows}
		{columns}
		bind:query
		{card}
		{bulk}
		onrow={openEdit}
		initialSort={{ key: def.fields[0].key, dir: 1 }}
		id={pageDef?.resource ? `${leaf.path}:${pageDef.resource}` : undefined}
		exportName={label}
		empty={loading ? 'Memuat data dari database…' : 'Belum ada data'}
	/>
</div>

{#if can.create}
	<button class="btn btn-primary fixed right-4 bottom-24 z-20 size-11 rounded-xl p-0 shadow-lg shadow-stone-900/20 sm:hidden" onclick={openNew} aria-label="Tambah">
		<Plus class="size-5" />
	</button>
{/if}

<Sheet bind:open title={editing ? `Ubah ${label}` : `Tambah ${label}`} subtitle={editing ? rowLabel(editing) : undefined}>
	{#if editing && tabs.length}
		<div class="sticky top-0 z-10 -mx-1 mb-4 bg-white px-1 pb-1 dark:bg-stone-900">
			<div class="flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800/60" role="tablist" aria-label="Bagian data">
				{#each [{ key: '', label }, ...tabs] as t (t.key)}
					<button
						role="tab"
						aria-selected={tab === t.key}
						class="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition {tab === t.key ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500'}"
						onclick={() => (tab = t.key)}>{t.label}</button
					>
				{/each}
			</div>
		</div>
	{/if}
	{#if editing && tab}
		{@const t = tabs.find((x) => x.key === tab)}
		{#if t}{@render t.panel(editing, reloadRow)}{/if}
	{/if}
	<form bind:this={formEl} id="master-form" class="grid gap-4 py-1 sm:grid-cols-2 {editing && tab ? 'hidden' : ''}" onsubmit={(e) => (e.preventDefault(), save())} {@attach formNav({ onsave: () => canSave && save(), last: () => saveBtn })}>
		{#each def.fields as f (f.key)}
			{#if !f.showIf || f.showIf(form)}
				{#if f.section}<h3 class="-mb-1 pt-2 text-xs font-medium tracking-wide text-stone-500 uppercase first:pt-0 sm:col-span-2">{f.section}</h3>{/if}
				<Field field={formField(f)} bind:form disabled={!canSave || locked(f) || opening} error={errors[f.key]} />
			{/if}
		{/each}
	</form>
	{#snippet footer()}
		{#if editing && tab}
			<div class="flex-1"></div>
			<button class="btn btn-secondary" onclick={() => (open = false)}>Tutup</button>
		{:else}
		{#if editing && can.delete}
			<button class="btn btn-ghost text-rose-600" onclick={remove} disabled={opening}><Trash class="size-4" /> <span class="hidden sm:inline">Hapus</span></button>
		{/if}
		{#if editing && def.copyable && can.create}
			<button class="btn btn-ghost" onclick={copyAsNew} disabled={opening} {@attach tooltip('Salin isian ini menjadi data baru')}><Copy class="size-4" /> <span class="hidden sm:inline">Salin jadi baru</span></button>
		{/if}
		<div class="flex-1"></div>
		<button class="btn btn-secondary" onclick={() => (open = false)}>Batal</button>
		{#if canSave}
			<button bind:this={saveBtn} class="btn btn-primary" type="submit" form="master-form" disabled={saving} {@attach tooltip('Simpan', { kbd: 'Ctrl S' })}>
				{saving ? 'Menyimpan…' : 'Simpan'}
			</button>
		{/if}
		{/if}
	{/snippet}
</Sheet>
