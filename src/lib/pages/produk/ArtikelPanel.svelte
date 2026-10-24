<script lang="ts">
	/**
	 * Warna & size model → proses artikel (PowerBuilder W_01_M01_ENTRY_B). Artikel dibuat untuk setiap
	 * warna × size terpilih yang belum ada; artikel lama tidak diubah. Harga per size yang sudah tersimpan
	 * terkunci (proses artikel lama juga tidak mengubahnya).
	 */
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { Check, Info, Lock, Search, Sparkles } from '@lucide/svelte';
	import { ApiError, api } from '#lib/util/api.ts';
	import { num } from '#lib/util/format.ts';
	import { hargaBarcode } from '#lib/domain/produk.ts';
	import type { Row } from '#lib/domain/types.ts';
	import { ask, toast } from '#lib/state/ui.svelte.ts';
	import NumberInput from '#lib/components/ui/NumberInput.svelte';
	import { tooltip } from '#lib/dom/tooltip.ts';

	let { model, canEdit, onprocessed }: { model: Row; canEdit: boolean; onprocessed?: (total: number) => void } = $props();

	const PRICES = [
		{ k: 'hbeli', l: 'Beli' },
		{ k: 'hjual', l: 'Jual' },
		{ k: 'hgrosir', l: 'Grosir' },
		{ k: 'pembilang', l: 'Pembilang', dec: 2 },
		{ k: 'penyebut', l: 'Penyebut', dec: 2 },
		{ k: 'hjual_barcode', l: 'Barcode' },
		{ k: 'mall_barcode', l: 'Mall' }
	] as const;

	interface Warna {
		id: string;
		nama: string;
		on: boolean;
		active: boolean;
	}
	interface Size extends Record<string, any> {
		id: string;
		nama: string;
		on: boolean;
		active: boolean;
		saved: boolean;
	}
	interface Palette {
		warna: Warna[];
		sizes: Size[];
		skus: string[];
	}

	let data = $state<Palette | null>(null);
	let loading = $state(true);
	let error = $state('');
	let busy = $state(false);
	let q = $state('');
	const warnaOn = new SvelteSet<string>();
	let sizes = $state<Size[]>([]);

	function apply(p: Palette) {
		data = p;
		warnaOn.clear();
		for (const w of p.warna) if (w.on) warnaOn.add(w.id);
		sizes = p.sizes.map((s) => ({ ...s }));
		onprocessed?.(p.skus.length);
	}

	async function load() {
		loading = true;
		error = '';
		try {
			apply(await api<Palette>(`/api/artikel/${encodeURIComponent(model.model_id)}`));
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Gagal memuat warna & size';
		} finally {
			loading = false;
		}
	}
	$effect(() => {
		void model.model_id;
		untrack(load);
	});

	const existing = $derived(new Set(data?.skus ?? []));
	const chosenSizes = $derived(sizes.filter((s) => s.on));
	const baru = $derived([...warnaOn].reduce((t, w) => t + chosenSizes.filter((s) => !existing.has(`${w}|${s.id}`)).length, 0));
	/** warna yang sudah tersimpan di model di atas (urutan tidak berubah saat dicentang), lalu urut nama */
	const warnaList = $derived.by(() => {
		const t = q.trim().toLowerCase();
		const list = (data?.warna ?? []).filter((w) => !t || w.nama.toLowerCase().includes(t) || w.id.toLowerCase().includes(t));
		return list.toSorted((a, b) => +b.on - +a.on || a.nama.localeCompare(b.nama));
	});
	const warnaName = (id: string) => data?.warna.find((w) => w.id === id)?.nama ?? id;

	function toggleWarna(id: string) {
		if (!canEdit) return;
		if (warnaOn.has(id)) warnaOn.delete(id);
		else warnaOn.add(id);
	}
	// dw_2 editchanged: harga barcode per size dihitung dari grosir & rasio
	function recalc(s: Size) {
		const b = hargaBarcode(s.hgrosir, s.pembilang, s.penyebut);
		if (b != null) s.hjual_barcode = b;
	}

	async function proses() {
		if (!warnaOn.size) return toast.error('Pilih minimal satu warna');
		if (!chosenSizes.length) return toast.error('Pilih minimal satu size');
		const lepas = (data?.warna.filter((w) => w.on && !warnaOn.has(w.id)).length ?? 0) + (data?.sizes.filter((s) => s.on && !sizes.find((x) => x.id === s.id)?.on).length ?? 0);
		const msg = [
			baru ? `${baru} artikel baru akan dibuat (${warnaOn.size} warna × ${chosenSizes.length} size).` : 'Tidak ada artikel baru; pilihan warna & size model disimpan.',
			lepas ? `${lepas} warna/size dilepas dari model — artikelnya yang sudah ada tetap tersimpan.` : ''
		].filter(Boolean).join(' ');
		if (!(await ask({ title: 'Proses artikel?', message: msg, confirmText: 'Proses' }))) return;
		busy = true;
		try {
			const body = { warna: [...warnaOn], sizes: chosenSizes.map((s) => ({ id: s.id, ...Object.fromEntries(PRICES.map((p) => [p.k, s[p.k] === '' ? null : s[p.k]])) })) };
			const r = await api<Palette & { added: number }>(`/api/artikel/${encodeURIComponent(model.model_id)}`, { method: 'POST', body });
			apply(r);
			toast.success(r.added ? `${r.added} artikel baru dibuat` : 'Warna & size model disimpan');
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal memproses artikel');
		} finally {
			busy = false;
		}
	}
</script>

{#if loading && !data}
	<div class="space-y-3 py-2" aria-busy="true">
		{#each [0, 1, 2] as i (i)}<div class="h-16 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800"></div>{/each}
	</div>
{:else if error}
	<div class="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
		{error} <button class="ml-2 underline" onclick={load}>Coba lagi</button>
	</div>
{:else if data}
	<div class="space-y-6 pb-2">
		<section>
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<h3 class="text-xs font-medium tracking-wide text-stone-500 uppercase">Warna <span class="text-stone-400 normal-case">· {warnaOn.size} dipilih</span></h3>
				<label class="relative ml-auto w-full sm:w-56">
					<Search class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-stone-400" />
					<input class="input h-9 pl-8 text-sm" placeholder="Cari warna…" bind:value={q} aria-label="Cari warna" />
				</label>
			</div>
			<div class="grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto overscroll-contain rounded-xl border border-stone-200 p-2 sm:grid-cols-3 lg:grid-cols-4 dark:border-stone-700">
				{#each warnaList as w (w.id)}
					{@const on = warnaOn.has(w.id)}
					<button
						type="button"
						class="flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition {on
							? 'border-brand-300 bg-brand-50 text-stone-900 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-stone-100'
							: 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-800'}"
						aria-pressed={on}
						disabled={!canEdit}
						onclick={() => toggleWarna(w.id)}
					>
						<span class="grid size-4 shrink-0 place-items-center rounded border {on ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 dark:border-stone-600'}">
							{#if on}<Check class="size-3" strokeWidth={3} />{/if}
						</span>
						<span class="min-w-0 flex-1 truncate">{w.nama}</span>
						<span class="font-mono text-[11px] text-stone-400">{w.id}</span>
					</button>
				{:else}
					<p class="col-span-full py-6 text-center text-sm text-stone-400">Tidak ada warna yang cocok</p>
				{/each}
			</div>
		</section>

		<section>
			<h3 class="mb-3 text-xs font-medium tracking-wide text-stone-500 uppercase">Size & harga <span class="text-stone-400 normal-case">· {chosenSizes.length} dipilih</span></h3>
			<div class="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
				<div class="hidden grid-cols-[8rem_repeat(7,minmax(0,1fr))] gap-2 bg-stone-50 px-3 py-2 text-[11px] font-medium text-stone-500 sm:grid dark:bg-stone-800/50">
					<span>Size</span>
					{#each PRICES as p (p.k)}<span class="text-right">{p.l}</span>{/each}
				</div>
				<ul class="divide-y divide-stone-100 dark:divide-stone-800">
					{#each sizes as s (s.id)}
						{@const ro = !canEdit || s.saved || !s.on}
						<li class="grid gap-2 px-3 py-2.5 sm:grid-cols-[8rem_repeat(7,minmax(0,1fr))] sm:items-center {s.on ? '' : 'opacity-60'}">
							<label class="flex cursor-pointer items-center gap-2 text-sm font-medium">
								<input type="checkbox" class="size-4 accent-brand-500" bind:checked={s.on} disabled={!canEdit} />
								<span class="truncate">{s.nama}</span>
								<span class="font-mono text-[11px] text-stone-400">{s.id}</span>
								{#if s.saved}<span class="text-stone-400" {@attach tooltip('Harga size ini sudah tersimpan')}><Lock class="size-3.5" /></span>{/if}
							</label>
							<div class="grid grid-cols-3 gap-2 sm:contents">
								{#each PRICES as p (p.k)}
									<div class="min-w-0">
										<span class="mb-0.5 block text-[10px] text-stone-400 sm:hidden">{p.l}</span>
										<NumberInput bind:value={s[p.k]} money={!('dec' in p)} decimals={'dec' in p ? p.dec : 0} compact disabled={ro} oninput={() => ['hgrosir', 'pembilang', 'penyebut'].includes(p.k) && recalc(s)} />
									</div>
								{/each}
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</section>

		<div class="flex items-start gap-2 rounded-xl bg-stone-50 px-3 py-2.5 text-xs text-stone-500 dark:bg-stone-800/40">
			<Info class="mt-0.5 size-4 shrink-0" />
			<p>
				Kode artikel = kode model + warna + size. Artikel yang sudah ada tidak diubah; melepas warna/size tidak menghapus artikelnya (hapus lewat tab Artikel).
				{#if warnaOn.size}Warna terpilih: {[...warnaOn].slice(0, 6).map(warnaName).join(', ')}{warnaOn.size > 6 ? `, +${warnaOn.size - 6}` : ''}.{/if}
			</p>
		</div>

		{#if canEdit}
			<div class="sticky bottom-0 -mx-1 flex items-center gap-3 border-t border-stone-100 bg-white px-1 pt-3 pb-1 dark:border-stone-800 dark:bg-stone-900">
				<p class="flex-1 text-sm text-stone-500">
					{#if baru}<b class="text-stone-800 dark:text-stone-100">{num(baru)}</b> artikel baru{:else}Tidak ada artikel baru{/if}
					<span class="text-stone-400">· {num(data.skus.length)} sudah ada</span>
				</p>
				<button class="btn btn-primary" onclick={proses} disabled={busy}><Sparkles class="size-4" /> {busy ? 'Memproses…' : 'Proses Artikel'}</button>
			</div>
		{/if}
	</div>
{/if}
