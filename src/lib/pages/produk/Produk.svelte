<script lang="ts">
	/**
	 * Master produk dari tabel lama (PowerBuilder W_01_M01): daftar model per brand & status seperti window
	 * lama, form model (kode model & model produk dibuat server saat simpan), warna & size → proses artikel,
	 * dan ubah artikel (SKU).
	 */
	import { untrack, type Snippet } from 'svelte';
	import { Ban, CircleCheck, Plus, RotateCw, Trash, TriangleAlert } from '@lucide/svelte';
	import { ApiError, api } from '#lib/util/api.ts';
	import { auth } from '#lib/state/auth.svelte.ts';
	import * as M from '#lib/domain/defs/masters.ts';
	import { money, num, today } from '#lib/util/format.ts';
	import { lookups } from '#lib/state/lookups.svelte.ts';
	import type { Leaf } from '#lib/domain/menu.ts';
	import { hargaBarcode, tahunBulan } from '#lib/domain/produk.ts';
	import type { FieldDef, Row } from '#lib/domain/types.ts';
	import { ask, toast } from '#lib/state/ui.svelte.ts';
	import DataTable from '#lib/components/data/DataTable.svelte';
	import Field from '#lib/components/ui/Field.svelte';
	import PageHeader from '#lib/components/data/PageHeader.svelte';
	import Select from '#lib/components/ui/Select.svelte';
	import Sheet from '#lib/components/ui/Sheet.svelte';
	import { loadSession, saveSession } from '#lib/components/data/grid/core.ts';
	import type { BulkAction, Col } from '#lib/components/data/types.ts';
	import { fields, formNav } from '#lib/dom/formNav.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';
	import ArtikelPanel from './ArtikelPanel.svelte';
	import SkuPanel from './SkuPanel.svelte';

	/** `nav` = tab menu Produk (pages/master/Atribut.svelte) */
	let { leaf, nav }: { leaf: Leaf; nav?: Snippet } = $props();

	const def = M.productModel;
	const url = '/api/master/produk';
	const can = $derived({ create: auth.can(leaf.path, 'create'), edit: auth.can(leaf.path, 'edit'), delete: auth.can(leaf.path, 'delete') });
	const field = (k: string) => def.fields.find((f) => f.key === k)!;

	/* ---------------- daftar per brand & status (seperti window lama) ---------------- */
	// svelte-ignore state_referenced_locally
	const sKey = `senja:page:${auth.user?.id ?? 'anon'}:${leaf.path}`;
	const s0 = loadSession(sKey, { brand: '', status: '1' });
	let brand = $state(s0.brand);
	let status = $state(s0.status);
	$effect(() => saveSession(sKey, { brand, status }));
	const brands = $derived(lookups.options('brand'));
	$effect(() => {
		if (brands.length && !brands.some((b) => b.id === brand)) brand = brands[0].id;
	});
	const STATUS = [
		{ key: '1', label: 'Aktif' },
		{ key: '0', label: 'Nonaktif' },
		{ key: '', label: 'Semua' }
	];

	let rows = $state<Row[]>([]);
	let loading = $state(false);
	let loadError = $state('');
	let query = $state('');
	const listUrl = $derived(`${url}?brand_id=${encodeURIComponent(brand)}${status ? `&flag_aktif=${status}` : ''}`);

	let seq = 0;
	async function load() {
		const my = ++seq;
		loading = true;
		loadError = '';
		try {
			const r = await api<{ rows: Row[] }>(listUrl);
			if (my === seq) rows = r.rows;
		} catch (e) {
			if (my === seq) loadError = e instanceof ApiError ? e.message : 'Gagal memuat data';
		} finally {
			if (my === seq) loading = false;
		}
	}
	$effect(() => {
		if (!brand) return;
		void listUrl;
		rows = [];
		untrack(load);
	});

	const name = (src: string) => (r: Row, k: string) => lookups.name(src, r[k]);
	const lk = (key: string, label: string, src: string): Col<Row> => ({ key, label, value: (r) => name(src)(r, key) });
	/** kode supplier & tipe hanya unik per brand */
	const perBrand = $derived(Object.fromEntries(['supplier', 'produk-tipe'].map((s) => [s, new Map(lookups.options(s).map((o) => [`${o.brand}|${o.id}`, o.name]))])));
	const lkBrand = (key: string, label: string, src: string): Col<Row> => ({ key, label, value: (r) => perBrand[src].get(`${r.brand_id}|${r[key]}`) ?? r[key] ?? '' });
	const harga = (key: string, label: string): Col<Row> => ({ key, label, align: 'right', value: (r) => Number(r[key]) || 0, format: money });
	// urutan kolom = grid W_01_M01 (PowerBuilder); kolom yang dimuat server: productModel.columns
	const columns: Col<Row>[] = [
		{ key: 'flag_aktif', label: 'Status', align: 'center', value: (r) => (r.flag_aktif ? 'Aktif' : 'Nonaktif'), cell: activeCell },
		{ key: 'model_id', label: 'Kode Model', cell: codeCell },
		{ key: 'model_id_lama', label: 'Kode Designer' },
		{ key: 'nama', label: 'Nama' },
		{ key: 'nama_pendek', label: 'Nama Pendek' },
		{ key: 'model_produk', label: 'Model Produk' },
		{ key: 'nama_pendek2', label: 'Nama Retail' },
		lkBrand('supp_id', 'Supplier', 'supplier'),
		harga('hbeli', 'Harga Beli'),
		harga('hjual', 'Harga Jual'),
		harga('hgrosir', 'Harga Grosir'),
		harga('hjual_barcode', 'Harga Barcode'),
		harga('mall_barcode', 'Harga Mall'),
		lk('brand_id', 'Brand', 'brand'),
		lk('gender_id', 'Gender', 'produk-gender'),
		lk('dept_id', 'Department', 'produk-dept'),
		lkBrand('tipe_id', 'Tipe', 'produk-tipe'),
		lk('jenis_id', 'Jenis', 'produk-jenis'),
		lk('bahan_id', 'Bahan', 'produk-bahan'),
		lk('aps_id', 'Aplikasi', 'produk-aplikasi')
	];
	const rowLabel = (r: Row) => [r.model_id, r.model_produk || r.nama].filter(Boolean).join(' — ');

	const bulk = $derived<BulkAction<Row>[]>([
		...(can.edit
			? [
					{ label: 'Aktifkan', icon: CircleCheck, when: (r: Row) => !r.flag_aktif, run: (rs: Row[]) => setActive(rs, true) },
					{ label: 'Nonaktifkan', icon: Ban, when: (r: Row) => !!r.flag_aktif, run: (rs: Row[]) => setActive(rs, false) }
				]
			: []),
		...(can.delete ? [{ label: 'Hapus', icon: Trash, danger: true, run: removeMany }] : [])
	]);
	async function setActive(rs: Row[], active: boolean) {
		try {
			await api(url, { method: 'PATCH', body: { ids: rs.map((r) => r.id), active } });
			const ids = new Set(rs.map((r) => r.id));
			// daftar per status: model yang pindah status keluar dari daftar ini
			rows = status ? rows.filter((r) => !ids.has(r.id)) : rows.map((r) => (ids.has(r.id) ? { ...r, flag_aktif: active } : r));
			toast.success(`${rs.length} model ${active ? 'diaktifkan' : 'dinonaktifkan'} beserta artikelnya`);
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal mengubah status');
			return false;
		}
	}
	async function removeMany(rs: Row[]) {
		const msg = 'Artikel, warna & size model ikut terhapus. Model yang sudah dipakai di transaksi tidak ikut dihapus.';
		if (!(await ask({ title: `Hapus ${rs.length} model?`, message: msg, danger: true, confirmText: 'Hapus' }))) return false;
		let done = 0;
		let firstError = '';
		for (const r of rs) {
			try {
				await api(`${url}?id=${encodeURIComponent(r.id)}`, { method: 'DELETE' });
				rows = rows.filter((x) => x.id !== r.id);
				done++;
			} catch (e) {
				firstError ||= e instanceof ApiError ? e.message : 'Gagal menghapus';
			}
		}
		if (done === rs.length) toast.success(`${done} model dihapus`);
		else if (done) toast.error(`${done} model dihapus, ${rs.length - done} tidak bisa dihapus. ${firstError}`);
		else toast.error(rs.length === 1 ? firstError : `Tidak ada yang terhapus. ${firstError}`);
		return done ? undefined : false;
	}

	/* ---------------- form model ---------------- */
	let open = $state(false);
	let tab = $state<'model' | 'warna' | 'artikel'>('model');
	let editing = $state<Row | null>(null);
	let form = $state<Record<string, any>>({});
	let errors = $state<Record<string, string>>({});
	let saving = $state(false);
	let opening = $state(false);
	let skuCount = $state<number | null>(null);
	let formEl = $state<HTMLFormElement>();
	let saveBtn = $state<HTMLButtonElement>();
	const canSave = $derived(editing ? can.edit : can.create);

	$effect(() => {
		if (!open || tab !== 'model' || opening || matchMedia('(pointer: coarse)').matches) return;
		requestAnimationFrame(() => formEl && fields(formEl)[0]?.focus());
	});

	// isian yang dihitung ulang hanya saat pengguna mengubah pemicunya (bukan saat data dibuka)
	let deptSeen = '';
	let priceSeen = '';
	const priceKey = () => `${form.hgrosir}|${form.pembilang}|${form.penyebut}`;
	function markSeen() {
		deptSeen = form.dept_id ?? '';
		priceSeen = priceKey();
	}
	// W_01_M01_ENTRY itemchanged: model baru → rasio dari diskon grup dept (pembilang = diskon, penyebut = 100 − diskon)
	$effect(() => {
		const d = String(form.dept_id ?? '');
		// diskon grup dari lookup; tunggu sampai termuat
		const ready = lookups.options('produk-grup-dept').length > 0;
		untrack(() => {
			if (d === deptSeen || !ready) return;
			deptSeen = d;
			const disc = Number(lookups.get('produk-grup-dept', d.slice(0, 1))?.disc);
			if (!editing && d && disc > 0 && disc < 100) [form.pembilang, form.penyebut] = [disc, 100 - disc];
		});
	});
	// editchanged: harga barcode & mall = grosir + grosir × pembilang / penyebut
	$effect(() => {
		const k = priceKey();
		untrack(() => {
			if (k === priceSeen) return;
			priceSeen = k;
			const b = hargaBarcode(form.hgrosir, form.pembilang, form.penyebut);
			if (b != null) [form.hjual_barcode, form.mall_barcode] = [b, b];
		});
	});

	function openNew() {
		const f: Record<string, any> = {};
		for (const fd of def.fields) f[fd.key] = typeof fd.default === 'function' ? fd.default({ today: today() }) : (fd.default ?? (fd.type === 'toggle' ? false : ''));
		f.brand_id = brand;
		form = f;
		markSeen();
		editing = null;
		errors = {};
		tab = 'model';
		skuCount = null;
		open = true;
	}

	async function openRow(r: Row) {
		editing = r;
		form = $state.snapshot(r) as Record<string, any>;
		errors = {};
		tab = 'model';
		skuCount = null;
		opening = true;
		open = true;
		try {
			const full = (await api<{ row: Row }>(`${url}?id=${encodeURIComponent(r.id)}`)).row;
			if (editing?.id !== r.id) return;
			editing = full;
			form = $state.snapshot(full) as Record<string, any>;
			markSeen();
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal memuat model');
			open = false;
		} finally {
			opening = false;
		}
	}

	const locked = (f: FieldDef) => (editing ? !!f.lockOnEdit : !!f.auto);
	/** petunjuk isian hanya untuk kolom yang masih bisa diisi */
	const shownField = (f: FieldDef): FieldDef => (locked(f) ? { ...f, hint: undefined } : f);

	function validate() {
		const e: Record<string, string> = {};
		for (const f of def.fields) {
			if (f.auto && !editing) continue;
			const v = form[f.key];
			const blank = v === '' || v == null || (typeof v === 'string' && !v.trim());
			if (f.required && blank) e[f.key] = `${f.label} wajib diisi`;
			else if ((f.type === 'number' || f.type === 'money') && +v < 0) e[f.key] = `${f.label} tidak boleh negatif`;
			else if (f.maxLength && typeof v === 'string' && v.trim().length > f.maxLength) e[f.key] = `${f.label} maksimal ${f.maxLength} karakter`;
		}
		if (!editing && form.nomor && !/^\d{3}$/.test(String(form.nomor).trim())) e.nomor = 'No. Artikel harus 3 digit angka';
		errors = e;
		return !Object.keys(e).length;
	}

	function putRow(row: Row, oldId?: string) {
		const i = rows.findIndex((r) => r.id === (oldId ?? row.id));
		if (i >= 0) rows[i] = row;
		else if (row.brand_id === brand && (!status || String(+!!row.flag_aktif) === status)) rows.unshift(row);
	}

	async function save() {
		if (saving || opening) return;
		if (!validate()) return toast.error('Periksa kembali isian form');
		saving = true;
		try {
			const values = $state.snapshot(form);
			if (editing) {
				// kirim hanya isian yang diganti, agar perubahan dari aplikasi lama di kolom lain tidak tertimpa
				for (const k of Object.keys(values)) if (JSON.stringify(values[k]) === JSON.stringify(editing[k])) delete values[k];
				const r = await api<{ row: Row }>(url, { method: 'PUT', body: { id: editing.id, values } });
				putRow(r.row, editing.id);
				editing = r.row;
				toast.success('Model diperbarui');
			} else {
				const r = await api<{ row: Row }>(url, { method: 'POST', body: values });
				putRow(r.row);
				editing = r.row;
				skuCount = 0;
				toast.success(`Model ${r.row.model_id} ditambahkan — lanjut pilih warna & size`);
				tab = 'warna';
			}
			form = $state.snapshot(editing) as Record<string, any>;
			markSeen();
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan');
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!editing) return;
		const msg = `${rowLabel(editing)}. Artikel, warna & size model ini ikut terhapus.`;
		if (!(await ask({ title: 'Hapus model ini?', message: msg, danger: true, confirmText: 'Hapus' }))) return;
		try {
			await api(`${url}?id=${encodeURIComponent(editing.id)}`, { method: 'DELETE' });
			rows = rows.filter((x) => x.id !== editing!.id);
			toast.success('Model dihapus');
			open = false;
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus');
		}
	}

	/* ---------------- pratinjau kode (model baru) ---------------- */
	const short = (src: string, id: unknown, attr = 'hint') => (id ? (lookups.get(src, id)?.[attr] ?? '') : '');
	const kode = $derived.by(() => {
		const tb = tahunBulan(String(form.period ?? ''));
		return [
			{ label: 'Brand', v: form.brand_id, w: 1 },
			{ label: 'Gender', v: form.gender_id, w: 1 },
			{ label: 'Dept', v: form.dept_id, w: 4 },
			{ label: 'Bahan', v: form.bahan_id, w: 3 },
			{ label: 'No.', v: form.nomor || '', w: 3, auto: !form.nomor },
			{ label: 'Thn·Bln', v: tb, w: 3 }
		];
	});
	const modelProduk = $derived.by(() => {
		const tb = tahunBulan(String(form.period ?? ''));
		const parts = [
			`${form.brand_id ?? ''}${tb.slice(0, 2)}`,
			short('produk-grup-dept', String(form.dept_id ?? '').slice(0, 1)),
			short('produk-dept', form.dept_id, 'short'),
			short('produk-bahan', form.bahan_id),
			short('produk-jenis', form.jenis_id),
			short('produk-aplikasi', form.aps_id)
		];
		return parts.every(Boolean) ? parts.join('-').slice(0, 21) : '';
	});

	// urutan isian = urutan entry W_01_M01_ENTRY (PowerBuilder)
	const GROUPS: { title: string; keys: string[] }[] = [
		{ title: 'Model', keys: ['brand_id', 'nama', 'nama_pendek', 'nama_pendek2', 'model_produk', 'prioritas', 'gender_id', 'supp_id', 'dept_id', 'bahan_id', 'tipe_id', 'aps_id', 'jenis_id', 'nomor', 'period'] },
		{ title: 'Harga & lainnya', keys: ['hbeli', 'hjual', 'hgrosir', 'pembilang', 'penyebut', 'model_id_lama', 'hjual_barcode', 'mall_barcode', 'sls_tipe'] }
	];
	const shown = (k: string) => !(k === 'model_produk' && !editing);
</script>

{#snippet activeCell(r: Row)}
	<span class="badge {r.flag_aktif ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}">{r.flag_aktif ? 'Aktif' : 'Nonaktif'}</span>
{/snippet}
{#snippet codeCell(r: Row)}
	<span class="font-mono text-xs font-medium text-stone-500">{r.model_id}</span>
{/snippet}

{#snippet card(r: Row)}
	<div class="flex items-center gap-3">
		<div class="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 font-mono text-xs font-semibold text-stone-500 dark:bg-stone-800">{r.brand_id}{r.gender_id}</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{r.model_produk || r.nama}</p>
			<p class="truncate text-xs text-stone-500">{[r.model_id, lookups.name('produk-dept', r.dept_id), r.nama_pendek2].filter(Boolean).join(' · ')}</p>
		</div>
		{#if !r.flag_aktif}<span class="badge bg-stone-100 text-stone-500 dark:bg-stone-800">Nonaktif</span>{/if}
	</div>
{/snippet}

<PageHeader title={leaf.label} subtitle="{loading ? 'Memuat…' : `${num(rows.length)} model`} · {leaf.trail.slice(0, -1).join(' › ')}" icon={leaf.icon}>
	{#snippet actions()}
		<button class="btn btn-secondary" onclick={load} disabled={loading || !brand} aria-label="Muat ulang" {@attach tooltip('Muat ulang dari database')}>
			<RotateCw class="size-4 {loading ? 'animate-spin' : ''}" />
		</button>
		{#if can.create}<button class="btn btn-primary hidden sm:inline-flex" onclick={openNew} disabled={!brand}><Plus class="size-4" /> Tambah Model</button>{/if}
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
		onrow={openRow}
		initialSort={{ key: 'model_id', dir: 1 }}
		freeze={2}
		searchPlaceholder="Cari kode / model / nama…"
		exportName="{leaf.label} {brand}"
		empty={loading ? 'Memuat data dari database…' : brands.length ? 'Belum ada model' : 'Anda belum diberi akses brand'}
	>
		{#snippet toolbar()}
			<div class="flex flex-wrap items-center gap-2">
				<div class="w-48 max-w-full">
					<Select bind:value={brand} options={brands.map((b) => ({ value: b.id, label: b.name, hint: b.code }))} label="Brand" placeholder="Brand" />
				</div>
				<div class="flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800/60" role="tablist" aria-label="Status model">
					{#each STATUS as s (s.key)}
						<button
							role="tab"
							aria-selected={status === s.key}
							class="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition {status === s.key ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500'}"
							onclick={() => (status = s.key)}>{s.label}</button
						>
					{/each}
				</div>
			</div>
		{/snippet}
	</DataTable>
</div>

{#if can.create}
	<button class="btn btn-primary fixed right-4 bottom-24 z-20 size-11 rounded-xl p-0 shadow-lg shadow-stone-900/20 sm:hidden" onclick={openNew} aria-label="Tambah model" disabled={!brand}>
		<Plus class="size-5" />
	</button>
{/if}

<Sheet bind:open size="xl" title={editing ? (editing.model_produk || editing.nama || 'Model') : 'Tambah Model'} subtitle={editing ? `${editing.model_id} · ${lookups.name('brand', editing.brand_id)}` : 'Kode model & model produk dibuat saat disimpan'}>
	{#if editing}
		<div class="sticky top-0 z-10 -mx-1 mb-4 bg-white px-1 pb-1 dark:bg-stone-900">
			<div class="flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800/60" role="tablist" aria-label="Bagian model">
				{#each [{ k: 'model', l: 'Model' }, { k: 'warna', l: 'Warna & Size' }, { k: 'artikel', l: skuCount == null ? 'Artikel' : `Artikel (${skuCount})` }] as t (t.k)}
					<button
						role="tab"
						aria-selected={tab === t.k}
						class="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition {tab === t.k ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500'}"
						onclick={() => (tab = t.k as typeof tab)}>{t.l}</button
					>
				{/each}
			</div>
		</div>
	{/if}

	{#if tab === 'model' || !editing}
		{#if !editing}
			<!-- pratinjau kode: sama dengan aturan aplikasi lama, nomor & urutan model produk diambil server saat simpan -->
			<div class="mb-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/40">
				<p class="text-xs font-medium tracking-wide text-stone-500 uppercase">Kode model</p>
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#each kode as s (s.label)}
						<div class="text-center">
							<div class="rounded-lg border px-2 py-1 font-mono text-sm font-semibold tracking-wider {s.v ? 'border-brand-200 bg-white text-stone-800 dark:border-brand-500/30 dark:bg-stone-900 dark:text-stone-100' : 'border-dashed border-stone-300 text-stone-300 dark:border-stone-600 dark:text-stone-600'}">
								{s.v || (s.auto ? '#'.repeat(s.w) : '·'.repeat(s.w))}
							</div>
							<p class="mt-1 text-[10px] text-stone-400">{s.label}</p>
						</div>
					{/each}
				</div>
				<p class="mt-3 text-xs text-stone-500">
					Model produk:
					<span class="font-mono font-medium text-stone-700 dark:text-stone-300">{modelProduk ? `${modelProduk}####` : '— lengkapi brand, dept, bahan, jenis & aplikasi'}</span>
				</p>
			</div>
		{/if}

		<form bind:this={formEl} id="model-form" onsubmit={(e) => (e.preventDefault(), save())} {@attach formNav({ onsave: () => canSave && save(), last: () => saveBtn })}>
			<fieldset disabled={opening} class="space-y-6 py-1">
				{#each GROUPS as g (g.title)}
					<section>
						<h3 class="mb-3 text-xs font-medium tracking-wide text-stone-500 uppercase">{g.title}</h3>
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{#each g.keys.filter(shown) as k (k)}
								{@const f = field(k)}
								<Field field={shownField(f)} bind:form disabled={!canSave || locked(f)} error={errors[k]} />
							{/each}
						</div>
					</section>
				{/each}
				<div class="sm:w-1/2 lg:w-1/3"><Field field={field('flag_aktif')} bind:form disabled={!canSave} /></div>
			</fieldset>
		</form>
	{:else if tab === 'warna'}
		<ArtikelPanel model={editing} canEdit={can.edit} onprocessed={(n) => (skuCount = n)} />
	{:else}
		<SkuPanel model={editing} canEdit={can.edit} canDelete={can.delete} bind:count={skuCount} />
	{/if}

	{#snippet footer()}
		{#if tab === 'model' || !editing}
			{#if editing && can.delete}
				<button class="btn btn-ghost text-rose-600" onclick={remove} disabled={opening}><Trash class="size-4" /> <span class="hidden sm:inline">Hapus</span></button>
			{/if}
			<div class="flex-1"></div>
			<button class="btn btn-secondary" onclick={() => (open = false)}>Batal</button>
			{#if canSave}
				<button bind:this={saveBtn} class="btn btn-primary" type="submit" form="model-form" disabled={saving || opening} {@attach tooltip('Simpan', { kbd: 'Ctrl S' })}>
					{saving ? 'Menyimpan…' : editing ? 'Simpan' : 'Simpan & lanjut'}
				</button>
			{/if}
		{:else}
			<div class="flex-1"></div>
			<button class="btn btn-secondary" onclick={() => (open = false)}>Tutup</button>
		{/if}
	{/snippet}
</Sheet>
