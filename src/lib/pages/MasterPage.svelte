<script lang="ts">
	import { Ban, CircleCheck, Download, Plus, Trash } from '@lucide/svelte';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { downloadCsv, num, rp, today } from '#lib/erp/format.ts';
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

	let { leaf }: { leaf: Leaf } = $props();

	const def = $derived(leaf.page as MasterDef);
	const rows = $derived(db.all(def.table));
	const codeKey = $derived(def.codeField ?? 'code');
	const can = $derived({
		create: auth.can(leaf.path, 'create'),
		edit: auth.can(leaf.path, 'edit'),
		delete: auth.can(leaf.path, 'delete')
	});

	let query = $state('');
	let open = $state(false);
	let form = $state<Record<string, any>>({});
	let editing = $state<Row | null>(null);
	let errors = $state<Record<string, string>>({});
	let formEl = $state<HTMLFormElement>();
	let saveBtn = $state<HTMLButtonElement>();
	const canSave = $derived(editing ? can.edit : can.create);

	// form dibuka → fokus ke isian pertama (desktop; di HP tidak memunculkan keyboard tiba-tiba)
	$effect(() => {
		if (!open || matchMedia('(pointer: coarse)').matches) return;
		requestAnimationFrame(() => fields(formEl!)[0]?.focus());
	});

	function display(f: FieldDef, r: Row) {
		const v = r[f.key];
		if (f.type === 'lookup') return db.name(f.ref!, v);
		if (f.type === 'money') return v ? rp(v) : '';
		if (f.type === 'toggle') return v ? 'Aktif' : 'Nonaktif';
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
				cell: f.type === 'toggle' ? toggleCell : f.key === codeKey ? codeCell : undefined
			}))
	);
	const fTitle = $derived(def.fields.find((f) => f.mobile === 'title'));
	const fSub = $derived(def.fields.find((f) => f.mobile === 'subtitle'));
	const fMeta = $derived(def.fields.find((f) => f.mobile === 'meta'));

	function openNew() {
		const ctx = { userStoreId: auth.user?.storeId ?? undefined, today: today() };
		const f: Record<string, any> = {};
		for (const fd of def.fields) f[fd.key] = typeof fd.default === 'function' ? fd.default(ctx) : (fd.default ?? (fd.type === 'toggle' ? false : ''));
		if (def.fields.some((x) => x.key === codeKey && x.required)) f[codeKey] = db.nextCode(def.table, codeKey);
		form = f;
		editing = null;
		errors = {};
		open = true;
	}
	function openEdit(r: Row) {
		form = $state.snapshot(r) as Record<string, any>;
		editing = r;
		errors = {};
		open = true;
	}

	function validate() {
		const e: Record<string, string> = {};
		for (const f of def.fields) {
			if (f.showIf && !f.showIf(form)) continue;
			const v = form[f.key];
			if (f.required && (v === '' || v == null)) e[f.key] = `${f.label} wajib diisi`;
			else if ((f.type === 'number' || f.type === 'money') && +v < 0) e[f.key] = `${f.label} tidak boleh negatif`;
			else if (f.unique && v !== '' && v != null && rows.some((r) => r.id !== form.id && String(r[f.key]).toLowerCase() === String(v).toLowerCase()))
				e[f.key] = `${f.label} "${v}" sudah digunakan`;
		}
		errors = e;
		return !Object.keys(e).length;
	}

	async function save() {
		if (!validate()) return toast.error('Periksa kembali isian form');
		if (editing) await db.update(def.table, editing.id, form);
		else await db.insert(def.table, form);
		toast.success(`${leaf.label} ${editing ? 'diperbarui' : 'ditambahkan'}`);
		open = false;
	}

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

	async function remove() {
		if (!editing) return;
		if (isUsed(editing.id)) return toast.error('Data sudah dipakai di transaksi/master lain. Nonaktifkan saja.');
		if (!(await ask({ title: 'Hapus data ini?', message: db.label(def.table, editing.id), danger: true, confirmText: 'Hapus' }))) return;
		await db.remove(def.table, editing.id);
		toast.success('Data dihapus');
		open = false;
	}

	const hasActive = $derived(def.fields.some((f) => f.key === 'active' && f.type === 'toggle'));
	const bulk = $derived<BulkAction<Row>[]>([
		...(can.edit && hasActive
			? [
					{ label: 'Aktifkan', icon: CircleCheck, when: (r: Row) => !r.active, run: (rs: Row[]) => setActive(rs, true) },
					{ label: 'Nonaktifkan', icon: Ban, when: (r: Row) => !!r.active, run: (rs: Row[]) => setActive(rs, false) }
				]
			: []),
		...(can.delete ? [{ label: 'Hapus', icon: Trash, danger: true, run: removeMany }] : [])
	]);
	async function setActive(rs: Row[], active: boolean) {
		for (const r of rs) await db.update(def.table, r.id, { active });
		toast.success(`${rs.length} data ${active ? 'diaktifkan' : 'dinonaktifkan'}`);
	}
	async function removeMany(rs: Row[]) {
		const free = rs.filter((r) => !isUsed(r.id));
		const used = rs.length - free.length;
		if (!free.length) {
			toast.error('Semua data terpilih sudah dipakai di transaksi/master lain. Nonaktifkan saja.');
			return false;
		}
		const msg = used ? `${used} data lain tidak ikut dihapus karena sudah dipakai.` : 'Tindakan ini tidak bisa dibatalkan.';
		if (!(await ask({ title: `Hapus ${free.length} data?`, message: msg, danger: true, confirmText: 'Hapus' }))) return false;
		for (const r of free) await db.remove(def.table, r.id);
		toast.success(`${free.length} data dihapus`);
	}

	function exportCsv() {
		const fs = def.fields.filter((f) => f.type !== 'password');
		downloadCsv(leaf.label, fs.map((f) => f.label), rows.map((r) => fs.map((f) => (f.type === 'money' || f.type === 'number' ? (r[f.key] ?? '') : display(f, r)))));
	}
</script>

{#snippet toggleCell(r: Row)}
	<span class="badge {r.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}">{r.active ? 'Aktif' : 'Nonaktif'}</span>
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
		{#if 'active' in r && !r.active}<span class="badge bg-stone-100 text-stone-500 dark:bg-stone-800">Nonaktif</span>{/if}
	</div>
{/snippet}

<PageHeader title={leaf.label} subtitle="{rows.length} data · {leaf.trail.slice(0, -1).join(' › ')}" icon={leaf.icon}>
	{#snippet actions()}
		<button class="btn btn-secondary" onclick={exportCsv}><Download class="size-4" /><span class="hidden sm:inline">Export</span></button>
		{#if can.create}<button class="btn btn-primary hidden sm:inline-flex" onclick={openNew}><Plus class="size-4" /> Tambah</button>{/if}
	{/snippet}
</PageHeader>

<div class="card overflow-clip">
	<DataTable {rows} {columns} bind:query {card} {bulk} onrow={openEdit} initialSort={{ key: def.fields[0].key, dir: 1 }} exportName={leaf.label} />
</div>

{#if can.create}
	<button class="btn btn-primary fixed right-4 bottom-24 z-20 size-11 rounded-xl p-0 shadow-lg shadow-stone-900/20 sm:hidden" onclick={openNew} aria-label="Tambah">
		<Plus class="size-5" />
	</button>
{/if}

<Sheet bind:open title={editing ? `Ubah ${leaf.label}` : `Tambah ${leaf.label}`} subtitle={editing ? db.label(def.table, editing.id) : undefined}>
	<form bind:this={formEl} id="master-form" class="grid gap-4 py-1 sm:grid-cols-2" onsubmit={(e) => (e.preventDefault(), save())} {@attach formNav({ onsave: () => canSave && save(), last: () => saveBtn })}>
		{#each def.fields as f (f.key)}
			{#if !f.showIf || f.showIf(form)}
				<Field field={f} bind:form disabled={editing ? !can.edit : !can.create} error={errors[f.key]} />
			{/if}
		{/each}
	</form>
	{#snippet footer()}
		{#if editing && can.delete}
			<button class="btn btn-ghost text-rose-600" onclick={remove}><Trash class="size-4" /> <span class="hidden sm:inline">Hapus</span></button>
		{/if}
		<div class="flex-1"></div>
		<button class="btn btn-secondary" onclick={() => (open = false)}>Batal</button>
		{#if editing ? can.edit : can.create}
			<button bind:this={saveBtn} class="btn btn-primary" type="submit" form="master-form" {@attach tooltip('Simpan', { kbd: 'Ctrl S' })}>Simpan</button>
		{/if}
	{/snippet}
</Sheet>
