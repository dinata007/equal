<script lang="ts">
	/** Riwayat kontrak pegawai + kontrak baru (PowerBuilder W_MS_08_ENTRY2: JOIN, PERPANJANG, ROLLING, RESIGN). */
	import { untrack } from 'svelte';
	import { FilePlus, Trash, X } from '@lucide/svelte';
	import { ApiError, api } from '#lib/erp/api.ts';
	import { date, today } from '#lib/erp/format.ts';
	import { lookups } from '#lib/erp/lookups.svelte.ts';
	import type { FieldDef, Row } from '#lib/erp/types.ts';
	import { ask, toast } from '#lib/erp/ui.svelte.ts';
	import Field from '#lib/components/Field.svelte';
	import { formNav } from '#lib/ui/formNav.ts';

	let { pegawai, canEdit, canDelete, onchange }: { pegawai: Row; canEdit: boolean; canDelete: boolean; onchange?: () => Promise<void> } = $props();

	interface Kontrak {
		id: string;
		tipe: string;
		tgl: string | null;
		tgl_awal: string | null;
		tgl_akhir: string | null;
		remark: string | null;
		jab_id: string | null;
		divisi_id: string | null;
		group_peg_id: string | null;
		sts_peg: string | null;
		aktif: boolean;
		pegangan: boolean;
		user: string | null;
	}
	type Data = { rows: Kontrak[]; pegawai: Record<string, any> };

	const TIPE = [
		{ key: 'JOIN', hint: 'Mulai bekerja', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
		{ key: 'PERPANJANG', hint: 'Perpanjang kontrak', tone: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
		{ key: 'ROLLING', hint: 'Pindah posisi', tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
		{ key: 'RESIGN', hint: 'Berhenti', tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' }
	];
	const tone = (t: string) => TIPE.find((x) => x.key === t)?.tone ?? 'bg-stone-100 text-stone-600 dark:bg-stone-800';

	const FIELDS: FieldDef[] = [
		{ key: 'tgl', label: 'Tanggal', type: 'date', required: true },
		{ key: 'sts_peg', label: 'Status Pegawai', type: 'select', required: true, options: ['PKWT', 'Tetap'] },
		{ key: 'tgl_awal', label: 'Kontrak Mulai', type: 'date', required: true },
		{ key: 'tgl_akhir', label: 'Kontrak Sampai', type: 'date', hint: 'Kosong hanya untuk pegawai tetap' },
		{ key: 'jab_id', label: 'Jabatan', type: 'lookup', source: 'jabatan' },
		{ key: 'divisi_id', label: 'Divisi', type: 'lookup', source: 'divisi', required: true },
		{ key: 'group_peg_id', label: 'Group Premi', type: 'lookup', source: 'group-pegawai', required: true },
		{ key: 'remark', label: 'Keterangan', maxLength: 100, span: 2 }
	];

	let data = $state<Data | null>(null);
	let loading = $state(true);
	let error = $state('');
	let adding = $state(false);
	let saving = $state(false);
	let form = $state<Record<string, any>>({});
	let errors = $state<Record<string, string>>({});
	let saveBtn = $state<HTMLButtonElement>();

	const url = $derived(`/api/pegawai/${encodeURIComponent(pegawai.id)}/kontrak`);
	const last = $derived(data?.rows[0]);

	async function load() {
		loading = true;
		error = '';
		try {
			data = await api<Data>(url);
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Gagal memuat kontrak';
		} finally {
			loading = false;
		}
	}
	$effect(() => {
		void url;
		untrack(load);
	});

	/** isian bawaan seperti PB: dari kontrak terakhir (atau data pegawai); perpanjang mulai dari akhir kontrak lama */
	function defaults(tipe: string) {
		const src = last ?? data?.pegawai ?? {};
		form = {
			tipe,
			tgl: today(),
			sts_peg: src.sts_peg || 'PKWT',
			tgl_awal: (tipe === 'PERPANJANG' ? last?.tgl_akhir : last?.tgl_awal) ?? today(),
			tgl_akhir: tipe === 'PERPANJANG' ? '' : (last?.tgl_akhir ?? ''),
			jab_id: src.jab_id ?? '',
			divisi_id: src.divisi_id ?? '',
			group_peg_id: src.group_peg_id ?? '',
			remark: ''
		};
		errors = {};
	}
	function startAdd() {
		defaults(last ? (last.tipe === 'RESIGN' ? 'JOIN' : 'PERPANJANG') : 'JOIN');
		adding = true;
	}

	function validate() {
		const e: Record<string, string> = {};
		for (const f of FIELDS) if (f.required && (form[f.key] == null || String(form[f.key]).trim() === '')) e[f.key] = `${f.label} wajib diisi`;
		if (!e.tgl_akhir && form.sts_peg === 'PKWT' && !form.tgl_akhir) e.tgl_akhir = 'Kontrak PKWT wajib punya tanggal akhir';
		if (form.tgl_akhir && form.tgl_awal && form.tgl_akhir <= form.tgl_awal) e.tgl_akhir = 'Harus setelah tanggal mulai';
		errors = e;
		return !Object.keys(e).length;
	}

	async function save() {
		if (saving || !validate()) return;
		const t = form.tipe;
		if (t === 'RESIGN' && !(await ask({ title: 'Catat RESIGN?', message: `${pegawai.nama} akan dinonaktifkan dan kontrak terakhirnya ditutup.`, danger: true, confirmText: 'Catat resign' }))) return;
		saving = true;
		try {
			data = await api<Data>(url, { method: 'POST', body: $state.snapshot(form) });
			adding = false;
			toast.success(`Kontrak ${t} dicatat`);
			await onchange?.();
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan kontrak');
		} finally {
			saving = false;
		}
	}

	async function remove(k: Kontrak) {
		const msg = `${k.tipe} ${date(k.tgl_awal ?? '')}${k.tgl_akhir ? ` – ${date(k.tgl_akhir)}` : ''}. Status kontrak lain & status pegawai tidak diubah.`;
		if (!(await ask({ title: 'Hapus kontrak ini?', message: msg, danger: true, confirmText: 'Hapus' }))) return;
		try {
			data = await api<Data>(`${url}?kontrak=${encodeURIComponent(k.id)}`, { method: 'DELETE' });
			toast.success('Kontrak dihapus');
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus kontrak');
		}
	}
</script>

{#if loading && !data}
	<div class="space-y-2 py-2" aria-busy="true">
		{#each [0, 1, 2] as i (i)}<div class="h-20 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800"></div>{/each}
	</div>
{:else if error}
	<div class="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
		{error} <button class="ml-2 underline" onclick={load}>Coba lagi</button>
	</div>
{:else if data}
	<div class="space-y-4 pb-2">
		{#if adding}
			<form
				class="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/5"
				onsubmit={(e) => (e.preventDefault(), save())}
				{@attach formNav({ onsave: save, last: () => saveBtn })}
			>
				<div class="mb-3 flex items-center gap-2">
					<p class="flex-1 text-sm font-medium">Kontrak baru</p>
					<button type="button" class="btn btn-ghost btn-icon btn-sm -mr-2" onclick={() => (adding = false)} aria-label="Tutup"><X class="size-4" /></button>
				</div>
				<div class="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-white/70 p-1 sm:grid-cols-4 dark:bg-stone-900/60" role="radiogroup" aria-label="Tipe kontrak">
					{#each TIPE as t (t.key)}
						<button
							type="button"
							role="radio"
							aria-checked={form.tipe === t.key}
							class="rounded-lg px-2 py-1.5 text-left transition {form.tipe === t.key ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}"
							onclick={() => defaults(t.key)}
						>
							<span class="block text-xs font-semibold">{t.key}</span>
							<span class="block text-[11px] text-stone-400">{t.hint}</span>
						</button>
					{/each}
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					{#each FIELDS as f (f.key)}
						<Field field={f} bind:form error={errors[f.key]} prefix="kontrak" />
					{/each}
				</div>
				<div class="mt-4 flex justify-end gap-2">
					<button type="button" class="btn btn-secondary" onclick={() => (adding = false)}>Batal</button>
					<button bind:this={saveBtn} class="btn {form.tipe === 'RESIGN' ? 'btn-danger' : 'btn-primary'}" disabled={saving}>{saving ? 'Menyimpan…' : `Simpan ${form.tipe}`}</button>
				</div>
			</form>
		{:else if canEdit}
			<button class="btn btn-secondary w-full justify-center" onclick={startAdd}><FilePlus class="size-4" /> Tambah kontrak</button>
		{/if}

		{#if !data.rows.length}
			<p class="py-10 text-center text-sm text-stone-400">Belum ada kontrak. Catat <b>JOIN</b> saat pegawai mulai bekerja.</p>
		{:else}
			<ol class="relative space-y-3 border-l border-stone-200 pl-5 dark:border-stone-700">
				{#each data.rows as k (k.id)}
					<li class="relative">
						<span class="absolute top-4 -left-[25px] size-2.5 rounded-full ring-4 ring-white dark:ring-stone-900 {k.aktif ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}"></span>
						<div class="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
							<div class="flex items-start gap-2">
								<div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
									<span class="badge {tone(k.tipe)}">{k.tipe}</span>
									<span class="text-sm font-medium tabular-nums">{date(k.tgl_awal ?? '')}{k.tgl_akhir ? ` – ${date(k.tgl_akhir)}` : ' – sekarang'}</span>
									{#if k.aktif}<span class="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">Aktif</span>{/if}
								</div>
								{#if canDelete}
									<button class="btn btn-ghost btn-icon btn-sm -mt-1 -mr-1 shrink-0 text-stone-400 hover:text-rose-600" onclick={() => remove(k)} aria-label="Hapus kontrak"><Trash class="size-4" /></button>
								{/if}
							</div>
							<p class="mt-1 text-xs text-stone-500">
								{[lookups.name('jabatan', k.jab_id), lookups.name('divisi', k.divisi_id), lookups.name('group-pegawai', k.group_peg_id), k.sts_peg].filter(Boolean).join(' · ')}
							</p>
							{#if k.remark}<p class="mt-1 text-sm">{k.remark}</p>{/if}
							<p class="mt-1 text-[11px] text-stone-400">Dicatat {date(k.tgl ?? '')}{k.user ? ` oleh ${k.user}` : ''}</p>
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
{/if}
