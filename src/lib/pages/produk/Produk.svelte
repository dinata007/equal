<script lang="ts" module>
	import type { Row } from '#lib/domain/types.ts';
	/** daftar model terakhir selama aplikasi terbuka: kembali ke menu ini langsung tampil, lalu diperbarui di belakang */
	let cache: Row[] | null = null;
	let fotoCache: Record<string, number> = {};
</script>

<script lang="ts">
	/**
	 * Master produk dari tabel lama (PowerBuilder W_01_M01), hanya baca: daftar model brand EQUALTREV.
	 * Klik model = detail berisi foto model (lihat FotoPanel.svelte).
	 */
	import { onMount, type Snippet } from 'svelte';
	import { RotateCw, TriangleAlert } from '@lucide/svelte';
	import { ApiError, api } from '#lib/util/api.ts';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { money, num } from '#lib/util/format.ts';
	import { lookups } from '#lib/state/lookups.svelte.ts';
	import type { Leaf } from '#lib/domain/menu.ts';
	import DataTable from '#lib/components/data/DataTable.svelte';
	import PageHeader from '#lib/components/data/PageHeader.svelte';
	import Sheet from '#lib/components/ui/Sheet.svelte';
	import type { Col } from '#lib/components/data/types.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';
	import FotoPanel from './FotoPanel.svelte';

	/** `nav` = tab menu Produk (pages/master/Atribut.svelte) */
	let { leaf, nav }: { leaf: Leaf; nav?: Snippet } = $props();

	const url = '/api/master/produk';

	/* ---------------- daftar model brand Equal (cakupan brand pengguna tetap disaring server) ---------------- */
	/** hanya brand EQUALTREV (M_PRODUK_BRAND 'A') yang ditampilkan */
	const BRAND = 'A';
	const brands = $derived(lookups.options('brand'));
	const hasBrand = $derived(brands.some((b) => b.id === BRAND));
	// $state.raw: belasan ribu baris tidak perlu dibuat reaktif per kolom (jauh lebih ringan); ubah = ganti array
	let rows = $state.raw<Row[]>(cache ?? []);
	let loading = $state(false);
	let loadError = $state('');
	let query = $state('');
	/** jumlah foto per kode model (kolom Foto) */
	let fotos = $state.raw<Record<string, number>>(fotoCache);

	let seq = 0;
	async function load() {
		const my = ++seq;
		loading = true;
		loadError = '';
		// jumlah foto dimuat bersamaan; gagal (mis. folder tidak bisa dibaca) tidak menggagalkan daftar
		const counts = api<{ counts: Record<string, number> }>('/api/produk-foto').catch(() => null);
		try {
			const r = await api<{ rows: Row[] }>(`${url}?brand_id=${BRAND}`);
			if (my === seq) rows = cache = r.rows;
			const c = await counts;
			if (my === seq && c) fotos = fotoCache = c.counts;
		} catch (e) {
			if (my === seq) loadError = e instanceof ApiError ? e.message : 'Gagal memuat data';
		} finally {
			if (my === seq) loading = false;
		}
	}
	onMount(() => void load());

	const name = (src: string) => (r: Row, k: string) => lookups.name(src, r[k]);
	const lk = (key: string, label: string, src: string): Col<Row> => ({ key, label, value: (r) => name(src)(r, key) });
	/** kode supplier hanya unik per brand */
	const suppliers = $derived(new Map(lookups.options('supplier').map((o) => [`${o.brand}|${o.id}`, o.name])));
	const harga = (key: string, label: string): Col<Row> => ({ key, label, align: 'right', value: (r) => Number(r[key]) || 0, format: money });
	// urutan kolom = grid W_01_M01 (PowerBuilder); kolom yang dimuat server: productModel.columns
	const columns: Col<Row>[] = [
		{ key: 'model_id', label: 'Kode Model', cell: codeCell },
		{ key: 'model_id_lama', label: 'Kode Designer' },
		{ key: 'nama_pendek', label: 'Nama Pendek' },
		{ key: 'foto', label: 'Foto', align: 'right', filter: 'number', value: (r) => fotos[r.model_id] ?? 0, cell: fotoCell },
		{ key: 'supp_id', label: 'Supplier', value: (r) => suppliers.get(`${r.brand_id}|${r.supp_id}`) ?? r.supp_id ?? '' },
		harga('hgrosir', 'Harga Grosir'),
		harga('hjual_barcode', 'Harga Barcode'),
		lk('dept_id', 'Department', 'produk-dept'),
		lk('jenis_id', 'Jenis', 'produk-jenis'),
		lk('bahan_id', 'Bahan', 'produk-bahan'),
		lk('aps_id', 'Aplikasi', 'produk-aplikasi')
	];

	/* ---------------- detail model: foto ---------------- */
	let open = $state(false);
	let model = $state.raw<Row | null>(null);
	let fotoCount = $state<number | null>(null);
	/** foto bukan data master lama: boleh ditambah/dihapus walau master produk hanya baca (cukup hak menu) */
	const canFoto = $derived(auth.can(leaf.path, 'edit'));

	/** jumlah foto model berubah (dimuat / tambah / hapus di panel) → kolom Foto ikut */
	function setFotoCount(r: Row, n: number) {
		fotoCount = n;
		if ((fotos[r.model_id] ?? 0) === n) return;
		const next = { ...fotos };
		if (n) next[r.model_id] = n;
		else delete next[r.model_id];
		fotos = fotoCache = next;
	}

	function openRow(r: Row) {
		model = r;
		fotoCount = null;
		open = true;
	}
</script>

{#snippet codeCell(r: Row)}
	<span class="font-mono text-xs font-medium text-stone-500">{r.model_id}</span>
{/snippet}

{#snippet fotoCell(r: Row)}
	{@const n = fotos[r.model_id] ?? 0}
	<span class="tabular-nums {n ? 'font-medium' : 'text-stone-300 dark:text-stone-600'}">{n}</span>
{/snippet}

{#snippet card(r: Row)}
	<div class="flex items-center gap-3">
		<div class="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 font-mono text-xs font-semibold text-stone-500 dark:bg-stone-800">{r.brand_id}{r.gender_id}</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{r.nama || r.model_id}</p>
			<p class="truncate text-xs text-stone-500">{[r.model_id, lookups.name('produk-dept', r.dept_id), r.nama_pendek].filter(Boolean).join(' · ')}</p>
		</div>
	</div>
{/snippet}

<PageHeader title={leaf.label} subtitle="{loading ? 'Memuat…' : `${num(rows.length)} model`} · {leaf.trail.slice(0, -1).join(' › ')}" icon={leaf.icon}>
	{#snippet actions()}
		<button class="btn btn-secondary" onclick={load} disabled={loading} aria-label="Muat ulang" {@attach tooltip('Muat ulang dari database')}>
			<RotateCw class="size-4 {loading ? 'animate-spin' : ''}" />
		</button>
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
		selectable={false}
		onrow={openRow}
		initialSort={{ key: 'model_id', dir: 1 }}
		freeze={2}
		searchPlaceholder="Cari kode / nama…"
		exportName={leaf.label}
		empty={loading ? 'Memuat data dari database…' : hasBrand || !brands.length ? 'Belum ada model' : 'Anda belum diberi akses brand Equal'}
	/>
</div>

<Sheet
	bind:open
	size="sm"
	title={model ? model.nama || model.model_id : 'Model'}
	subtitle={model ? [model.model_id, model.nama_pendek, fotoCount == null ? '' : `${fotoCount} foto`].filter(Boolean).join(' · ') : ''}
>
	{#if model}
		{#key model.id}
			<FotoPanel {model} canEdit={canFoto} oncount={(n) => setFotoCount(model!, n)} />
		{/key}
	{/if}

	{#snippet footer()}
		<div class="flex-1"></div>
		<button class="btn btn-secondary" onclick={() => (open = false)}>Tutup</button>
	{/snippet}
</Sheet>
