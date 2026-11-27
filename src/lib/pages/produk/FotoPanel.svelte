<script lang="ts">
	/**
	 * Foto model produk (disimpan di folder PRODUK_FOTO_DIR server, lihat server/produk-foto.ts).
	 * Satu model boleh banyak foto. Klik foto = tampilan besar (panah kiri/kanan untuk berpindah).
	 * Unggah: foto sampai 3 MB dikirim apa adanya; di atas 3 MB (atau format lain) dikompres dulu di browser
	 * menjadi WebP/JPEG hingga di bawah 3 MB.
	 */
	import { onMount } from 'svelte';
	import { ChevronLeft, ChevronRight, ImageOff, ImagePlus, Trash, TriangleAlert, X } from '@lucide/svelte';
	import { ApiError, api } from '#lib/util/api.ts';
	import type { Row } from '#lib/domain/types.ts';
	import { ask, toast } from '#lib/state/ui.svelte.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';

	interface Foto {
		name: string;
		size: number;
		at: string;
	}

	let { model, canEdit, oncount }: { model: Row; canEdit: boolean; oncount?: (n: number) => void } = $props();

	/** sama dengan FOTO_MAX_BYTES di server */
	const MAX_BYTES = 3 * 1024 * 1024;
	const AS_IS = ['image/jpeg', 'image/png', 'image/webp'];

	const base = $derived(`/api/produk-foto/${encodeURIComponent(model.id)}`);
	const src = (f: Foto) => `${base}/${encodeURIComponent(f.name)}`;

	let fotos = $state<Foto[]>([]);
	let loading = $state(true);
	let error = $state('');
	let uploading = $state(0);
	let fileEl = $state<HTMLInputElement>();
	let dialog = $state<HTMLDialogElement>();
	let view = $state(-1);

	function set(list: Foto[]) {
		fotos = list;
		oncount?.(list.length);
	}

	async function load() {
		loading = true;
		error = '';
		try {
			set((await api<{ fotos: Foto[] }>(base)).fotos);
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Foto gagal dimuat';
		} finally {
			loading = false;
		}
	}
	onMount(() => void load());

	/**
	 * ≤ 3 MB & JPEG/PNG/WebP → file asli. Selain itu konversi ke WebP (JPEG bila browser tidak bisa WebP):
	 * mulai dari ukuran asli kualitas tinggi, lalu turunkan kualitas/ukuran sampai di bawah 3 MB.
	 */
	async function prepare(file: File): Promise<Blob> {
		if (file.size <= MAX_BYTES && AS_IS.includes(file.type)) return file;
		const bmp = await createImageBitmap(file);
		try {
			for (const [side, quality] of [
				[Infinity, 0.9],
				[Infinity, 0.8],
				[4000, 0.85],
				[3000, 0.85],
				[2400, 0.8],
				[1600, 0.75]
			]) {
				const k = Math.min(1, side / Math.max(bmp.width, bmp.height));
				const w = Math.max(1, Math.round(bmp.width * k));
				const h = Math.max(1, Math.round(bmp.height * k));
				const c = new OffscreenCanvas(w, h);
				const ctx = c.getContext('2d')!;
				ctx.fillStyle = '#fff';
				ctx.fillRect(0, 0, w, h);
				ctx.drawImage(bmp, 0, 0, w, h);
				let blob = await c.convertToBlob({ type: 'image/webp', quality });
				// Safari lama tidak bisa menyandikan WebP
				if (blob.type !== 'image/webp') blob = await c.convertToBlob({ type: 'image/jpeg', quality });
				if (blob.size <= MAX_BYTES) return blob;
			}
			throw new Error('Foto terlalu besar');
		} finally {
			bmp.close();
		}
	}

	async function upload(files: FileList | null) {
		if (!files?.length) return;
		const list = [...files].filter((f) => f.type.startsWith('image/'));
		if (!list.length) return toast.error('Pilih file gambar (JPEG, PNG, atau WebP)');
		uploading = list.length;
		let ok = 0;
		let firstError = '';
		for (const f of list) {
			try {
				const blob = await prepare(f);
				const res = await fetch(base, { method: 'POST', headers: { 'content-type': blob.type }, body: blob });
				const data = await res.json().catch(() => ({}));
				if (!res.ok) throw new ApiError(data?.error ?? `Gagal mengunggah (${res.status})`, res.status);
				set(data.fotos);
				ok++;
			} catch (e) {
				firstError ||= `${f.name}: ${e instanceof Error ? e.message : 'gagal diunggah'}`;
			} finally {
				uploading--;
			}
		}
		if (fileEl) fileEl.value = '';
		if (ok === list.length) toast.success(ok === 1 ? 'Foto ditambahkan' : `${ok} foto ditambahkan`);
		else toast.error(ok ? `${ok} foto ditambahkan, ${list.length - ok} gagal. ${firstError}` : firstError);
	}

	async function remove(i: number) {
		const f = fotos[i];
		if (!f || !(await ask({ title: 'Hapus foto ini?', message: 'Foto dihapus dari folder server dan tidak bisa dikembalikan.', danger: true, confirmText: 'Hapus' }))) return;
		try {
			set((await api<{ fotos: Foto[] }>(`${base}/${encodeURIComponent(f.name)}`, { method: 'DELETE' })).fotos);
			if (view >= fotos.length) view = fotos.length - 1;
			if (view < 0) dialog?.close();
			toast.success('Foto dihapus');
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus foto');
		}
	}

	function open(i: number) {
		view = i;
		dialog?.showModal();
	}
	const step = (d: number) => fotos.length && (view = (view + d + fotos.length) % fotos.length);
	function onkey(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') (e.preventDefault(), step(-1));
		else if (e.key === 'ArrowRight') (e.preventDefault(), step(1));
	}
	const when = (iso: string) => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`;
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-sm text-stone-500">
			{#if loading}Memuat foto…{:else if error}&nbsp;{:else}{fotos.length ? `${fotos.length} foto` : 'Belum ada foto'}{/if}
		</p>
		{#if canEdit && !error}
			<input bind:this={fileEl} type="file" accept="image/*" multiple class="hidden" onchange={(e) => upload(e.currentTarget.files)} />
			<button type="button" class="btn btn-secondary" onclick={() => fileEl?.click()} disabled={loading || uploading > 0}>
				<ImagePlus class="size-4" />
				{uploading ? `Mengunggah… (${uploading})` : 'Tambah foto'}
			</button>
		{/if}
	</div>

	{#if error}
		<div class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
			<TriangleAlert class="mt-0.5 size-4 shrink-0" />
			<p class="flex-1">{error}</p>
			<button type="button" class="btn btn-secondary btn-sm" onclick={load}>Coba lagi</button>
		</div>
	{:else if !loading && !fotos.length}
		<div class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 py-14 text-center text-stone-400 dark:border-stone-700">
			<ImageOff class="size-10 stroke-1" />
			<p class="text-sm">Model ini belum punya foto</p>
			{#if canEdit}<button type="button" class="btn btn-secondary btn-sm mt-1" onclick={() => fileEl?.click()}><ImagePlus class="size-4" /> Tambah foto</button>{/if}
		</div>
	{:else}
		<div class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
			{#each fotos as f, i (f.name)}
				<div class="group relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800">
					<button type="button" class="block size-full" onclick={() => open(i)} aria-label="Lihat foto {i + 1}">
						<img src={src(f)} alt="Foto {i + 1} {model.model_id}" loading="lazy" decoding="async" class="size-full object-cover transition group-hover:scale-[1.03]" />
					</button>
					{#if canEdit}
						<button
							type="button"
							class="absolute top-1 right-1 grid size-7 place-items-center rounded-md bg-white/90 text-rose-600 opacity-0 shadow-sm transition group-hover:opacity-100 focus:opacity-100 max-sm:opacity-100 dark:bg-stone-900/90"
							onclick={() => remove(i)}
							aria-label="Hapus foto {i + 1}"
							{@attach tooltip('Hapus foto')}
						>
							<Trash class="size-3.5" />
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- tampilan besar -->
<dialog
	bind:this={dialog}
	onclose={() => (view = -1)}
	onkeydown={onkey}
	class="m-auto size-full max-h-none max-w-none bg-transparent p-0 backdrop:bg-stone-950/85 backdrop:backdrop-blur-sm"
	aria-label="Foto produk"
>
	{#if view >= 0 && fotos[view]}
		{@const f = fotos[view]}
		<div class="flex size-full flex-col text-white">
			<div class="flex items-center gap-3 px-4 py-3">
				<p class="min-w-0 flex-1 truncate text-sm">
					<span class="font-medium">{view + 1} / {fotos.length}</span>
					<span class="text-white/60"> · {model.model_id} · {when(f.at)} · {kb(f.size)}</span>
				</p>
				{#if canEdit}
					<button type="button" class="grid size-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white" onclick={() => remove(view)} aria-label="Hapus foto">
						<Trash class="size-5" />
					</button>
				{/if}
				<button type="button" class="grid size-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white" onclick={() => dialog?.close()} aria-label="Tutup">
					<X class="size-5" />
				</button>
			</div>
			<div class="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
				<img src={src(f)} alt="Foto {view + 1} {model.model_id}" class="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
				{#if fotos.length > 1}
					<button type="button" class="absolute left-2 grid size-11 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 sm:left-4" onclick={() => step(-1)} aria-label="Foto sebelumnya">
						<ChevronLeft class="size-6" />
					</button>
					<button type="button" class="absolute right-2 grid size-11 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 sm:right-4" onclick={() => step(1)} aria-label="Foto berikutnya">
						<ChevronRight class="size-6" />
					</button>
				{/if}
			</div>
		</div>
	{/if}
</dialog>
