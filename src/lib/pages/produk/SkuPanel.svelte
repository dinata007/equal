<script lang="ts">
	/** Artikel (SKU) satu model: daftar, ubah nama/kode mall/harga barcode (W_01_M01_B), hapus yang belum dipakai. */
	import { untrack } from 'svelte';
	import { PackageOpen, Search, Trash, X } from '@lucide/svelte';
	import { ApiError, api } from '#lib/util/api.ts';
	import * as M from '#lib/domain/defs/masters.ts';
	import { money } from '#lib/util/format.ts';
	import { lookups } from '#lib/state/lookups.svelte.ts';
	import type { Row } from '#lib/domain/types.ts';
	import { ask, toast } from '#lib/state/ui.svelte.ts';
	import Field from '#lib/components/ui/Field.svelte';
	import { formNav } from '#lib/dom/formNav.ts';

	let { model, canEdit, canDelete, count = $bindable() }: { model: Row; canEdit: boolean; canDelete: boolean; count?: number | null } = $props();

	const def = M.productSku;
	const url = '/api/master/produk-artikel';
	const EDIT = ['nama', 'nama_pendek', 'nama_pendek2', 'kode_mall', 'hjual_barcode', 'mall_barcode', 'hbeli', 'hjual', 'hgrosir'];
	const fieldsOf = EDIT.map((k) => def.fields.find((f) => f.key === k)!);

	let rows = $state<Row[]>([]);
	let loading = $state(true);
	let error = $state('');
	let q = $state('');
	let sel = $state<Row | null>(null);
	let form = $state<Record<string, any>>({});
	let errors = $state<Record<string, string>>({});
	let saving = $state(false);
	let saveBtn = $state<HTMLButtonElement>();

	async function load() {
		loading = true;
		error = '';
		try {
			rows = (await api<{ rows: Row[] }>(`${url}?model_id=${encodeURIComponent(model.model_id)}`)).rows;
			count = rows.length;
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Gagal memuat artikel';
		} finally {
			loading = false;
		}
	}
	$effect(() => {
		void model.model_id;
		untrack(load);
	});

	const urut = (id: string) => Number(lookups.get('produk-size', id)?.urut ?? 999);
	const list = $derived.by(() => {
		const t = q.trim().toLowerCase();
		return rows
			.filter((r) => !t || [r.produk_id, r.nama, r.nama_pendek2, r.kode_mall, lookups.name('produk-warna', r.warna_id)].some((v) => String(v ?? '').toLowerCase().includes(t)))
			.toSorted((a, b) => lookups.name('produk-warna', a.warna_id).localeCompare(lookups.name('produk-warna', b.warna_id)) || urut(a.size_id) - urut(b.size_id));
	});

	function pick(r: Row) {
		sel = r;
		form = $state.snapshot(r) as Record<string, any>;
		errors = {};
	}

	async function save() {
		if (!sel || saving) return;
		const e: Record<string, string> = {};
		for (const f of fieldsOf) {
			const v = form[f.key];
			if (f.required && (v == null || String(v).trim() === '')) e[f.key] = `${f.label} wajib diisi`;
			else if (f.maxLength && typeof v === 'string' && v.trim().length > f.maxLength) e[f.key] = `${f.label} maksimal ${f.maxLength} karakter`;
		}
		errors = e;
		if (Object.keys(e).length) return toast.error('Periksa kembali isian artikel');
		const values = $state.snapshot(form);
		for (const k of Object.keys(values)) if (!EDIT.includes(k) || JSON.stringify(values[k]) === JSON.stringify(sel[k])) delete values[k];
		if (!Object.keys(values).length) return void (sel = null);
		saving = true;
		try {
			const r = await api<{ row: Row }>(url, { method: 'PUT', body: { id: sel.id, values } });
			rows = rows.map((x) => (x.id === r.row.id ? r.row : x));
			toast.success(`Artikel ${r.row.produk_id} diperbarui`);
			sel = null;
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Gagal menyimpan');
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!sel) return;
		if (!(await ask({ title: 'Hapus artikel ini?', message: `${sel.produk_id} — ${sel.nama}`, danger: true, confirmText: 'Hapus' }))) return;
		try {
			await api(`${url}?id=${encodeURIComponent(sel.id)}`, { method: 'DELETE' });
			rows = rows.filter((x) => x.id !== sel!.id);
			count = rows.length;
			toast.success('Artikel dihapus');
			sel = null;
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Gagal menghapus');
		}
	}
</script>

{#if loading && !rows.length}
	<div class="space-y-2 py-2" aria-busy="true">
		{#each [0, 1, 2, 3] as i (i)}<div class="h-11 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800"></div>{/each}
	</div>
{:else if error}
	<div class="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
		{error} <button class="ml-2 underline" onclick={load}>Coba lagi</button>
	</div>
{:else if !rows.length}
	<div class="grid place-items-center py-14 text-center">
		<PackageOpen class="size-12 stroke-1 text-stone-300" />
		<p class="mt-3 font-medium">Belum ada artikel</p>
		<p class="mt-1 text-sm text-stone-500">Pilih warna & size di tab <b>Warna & Size</b>, lalu Proses Artikel.</p>
	</div>
{:else}
	{#if sel}
		<form
			class="mb-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/5"
			onsubmit={(e) => (e.preventDefault(), save())}
			{@attach formNav({ onsave: () => canEdit && save(), last: () => saveBtn })}
		>
			<div class="mb-3 flex items-start gap-2">
				<div class="min-w-0 flex-1">
					<p class="font-mono text-xs text-stone-500">{sel.produk_id}</p>
					<p class="truncate text-sm font-medium">{lookups.name('produk-warna', sel.warna_id)} · {lookups.name('produk-size', sel.size_id)}</p>
				</div>
				<button type="button" class="btn btn-ghost btn-icon btn-sm -mt-1 -mr-2" onclick={() => (sel = null)} aria-label="Tutup"><X class="size-4" /></button>
			</div>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each fieldsOf as f (f.key)}
					<Field field={f} bind:form disabled={!canEdit} error={errors[f.key]} />
				{/each}
			</div>
			<div class="mt-4 flex items-center gap-2">
				{#if canDelete}<button type="button" class="btn btn-ghost text-rose-600" onclick={remove}><Trash class="size-4" /> Hapus</button>{/if}
				<div class="flex-1"></div>
				<button type="button" class="btn btn-secondary" onclick={() => (sel = null)}>Batal</button>
				{#if canEdit}<button bind:this={saveBtn} class="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>{/if}
			</div>
		</form>
	{/if}

	<label class="relative mb-3 block">
		<Search class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-stone-400" />
		<input class="input h-9 pl-8 text-sm" placeholder="Cari kode / warna / nama…" bind:value={q} aria-label="Cari artikel" />
	</label>

	<div class="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
		<table class="w-full min-w-[40rem] text-sm">
			<thead class="bg-stone-50 text-left text-[11px] font-medium text-stone-500 dark:bg-stone-800/50">
				<tr>
					<th class="px-3 py-2 font-medium">Kode Artikel</th>
					<th class="px-3 py-2 font-medium">Warna</th>
					<th class="px-3 py-2 font-medium">Size</th>
					<th class="px-3 py-2 font-medium">Nama Retail</th>
					<th class="px-3 py-2 font-medium">Kode Mall</th>
					<th class="px-3 py-2 text-right font-medium">Barcode</th>
					<th class="px-3 py-2 text-right font-medium">Mall</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-stone-100 dark:divide-stone-800">
				{#each list as r (r.id)}
					<tr
						class="cursor-pointer transition hover:bg-stone-50 dark:hover:bg-stone-800/50 {sel?.id === r.id ? 'bg-brand-50 dark:bg-brand-500/10' : ''}"
						onclick={() => pick(r)}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(r))}
						tabindex="0"
					>
						<td class="px-3 py-2 font-mono text-xs text-stone-500">{r.produk_id}</td>
						<td class="px-3 py-2">{lookups.name('produk-warna', r.warna_id)}</td>
						<td class="px-3 py-2">{lookups.name('produk-size', r.size_id)}</td>
						<td class="px-3 py-2">{r.nama_pendek2}</td>
						<td class="px-3 py-2 font-mono text-xs">{r.kode_mall}</td>
						<td class="px-3 py-2 text-right tabular-nums">{money(r.hjual_barcode)}</td>
						<td class="px-3 py-2 text-right tabular-nums">{money(r.mall_barcode)}</td>
					</tr>
				{:else}
					<tr><td colspan="7" class="px-3 py-8 text-center text-stone-400">Tidak ada artikel yang cocok</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
