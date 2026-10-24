<script lang="ts">
	/**
	 * Crop foto profil: geser (drag / panah), zoom (scroll, cubit dua jari, slider, + −), putar 90°.
	 * Bisa di-zoom out sampai seluruh gambar masuk (sisa latar putih). Hasil 512×512 WebP (JPEG bila browser tidak bisa WebP).
	 */
	import { tooltip } from '#lib/ui/tooltip.ts';
	import { LoaderCircle, RotateCcw, RotateCw, ZoomIn, ZoomOut } from '@lucide/svelte';

	let {
		file = $bindable(null),
		onsave
	}: {
		/** file yang sedang di-crop (null = dialog tertutup) */
		file: File | null;
		onsave: (blob: Blob) => Promise<boolean>;
	} = $props();

	const VIEW = 288; // ukuran area crop (px CSS)
	const OUT = 512; // ukuran hasil
	const MAX_ZOOM = 4;

	let dialog = $state<HTMLDialogElement>();
	let canvas = $state<HTMLCanvasElement>();
	let bmp = $state<ImageBitmap | null>(null);
	let error = $state('');
	let saving = $state(false);
	let dragging = $state(false);
	let zoom = $state(1);
	let rot = $state(0);
	let tx = $state(0);
	let ty = $state(0);

	// ukuran gambar setelah diputar & skala "cover" (zoom 1 = sisi terpendek pas lingkaran);
	// min = zoom terkecil saat seluruh gambar masuk ke dalam LINGKARAN (diagonal pas diameter), sisanya latar putih
	const dims = $derived.by(() => {
		if (!bmp) return { w: 0, h: 0, base: 1, min: 1 };
		const [w, h] = rot % 180 ? [bmp.height, bmp.width] : [bmp.width, bmp.height];
		return { w, h, base: VIEW / Math.min(w, h), min: Math.min(w, h) / Math.hypot(w, h) };
	});

	function clamp() {
		const s = dims.base * zoom;
		const mx = Math.max(0, (dims.w * s - VIEW) / 2);
		const my = Math.max(0, (dims.h * s - VIEW) / 2);
		tx = Math.min(mx, Math.max(-mx, tx));
		ty = Math.min(my, Math.max(-my, ty));
	}

	/** zoom dengan titik (px relatif tengah) tetap di tempat */
	function zoomTo(z: number, px = 0, py = 0) {
		const next = Math.min(MAX_ZOOM, Math.max(dims.min, z));
		const k = next / zoom;
		tx = px - (px - tx) * k;
		ty = py - (py - ty) * k;
		zoom = next;
		clamp();
	}

	function draw(ctx: CanvasRenderingContext2D, size: number) {
		if (!bmp) return;
		const k = size / VIEW;
		const s = dims.base * zoom * k;
		ctx.save();
		// latar putih: terlihat bila gambar di-zoom out sampai lebih kecil dari lingkaran (pratinjau = hasil)
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, size, size);
		ctx.imageSmoothingQuality = 'high';
		ctx.translate(size / 2 + tx * k, size / 2 + ty * k);
		ctx.rotate((rot * Math.PI) / 180);
		ctx.scale(s, s);
		ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
		ctx.restore();
	}

	// buka / tutup mengikuti file
	$effect(() => {
		const f = file;
		if (!f) return;
		error = '';
		zoom = 1;
		rot = tx = ty = 0;
		bmp = null;
		dialog?.showModal();
		let cancelled = false;
		createImageBitmap(f)
			.then((b) => (cancelled ? b.close() : (bmp = b)))
			.catch(() => (error = 'Gambar tidak bisa dibaca. Pakai JPG, PNG, atau WebP.'));
		return () => {
			cancelled = true;
		};
	});

	// gambar ulang setiap posisi berubah (ketajaman mengikuti layar)
	$effect(() => {
		if (!canvas || !bmp) return;
		void [zoom, rot, tx, ty];
		const dpr = Math.min(devicePixelRatio || 1, 3);
		canvas.width = canvas.height = Math.round(VIEW * dpr);
		draw(canvas.getContext('2d')!, VIEW * dpr);
	});

	function close() {
		dialog?.close();
	}
	function onclose() {
		bmp?.close();
		bmp = null;
		file = null;
	}

	/* ---- geser & cubit (pointer events) ---- */
	const pointers = new Map<number, { x: number; y: number }>();
	let pinch = 0;
	const center = (el: HTMLElement) => {
		const r = el.getBoundingClientRect();
		return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
	};
	function down(e: PointerEvent) {
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		dragging = true;
		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			pinch = Math.hypot(a.x - b.x, a.y - b.y);
		}
	}
	function move(e: PointerEvent) {
		const prev = pointers.get(e.pointerId);
		if (!prev) return;
		const cur = { x: e.clientX, y: e.clientY };
		pointers.set(e.pointerId, cur);
		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			const d = Math.hypot(a.x - b.x, a.y - b.y);
			const { cx, cy } = center(e.currentTarget as HTMLElement);
			if (pinch) zoomTo(zoom * (d / pinch), (a.x + b.x) / 2 - cx, (a.y + b.y) / 2 - cy);
			pinch = d;
			return;
		}
		tx += cur.x - prev.x;
		ty += cur.y - prev.y;
		clamp();
	}
	function up(e: PointerEvent) {
		pointers.delete(e.pointerId);
		pinch = 0;
		dragging = pointers.size > 0;
	}
	function wheel(e: WheelEvent) {
		e.preventDefault();
		const { cx, cy } = center(e.currentTarget as HTMLElement);
		zoomTo(zoom * Math.exp(-e.deltaY * 0.0015), e.clientX - cx, e.clientY - cy);
	}
	function key(e: KeyboardEvent) {
		const step = e.shiftKey ? 40 : 10;
		const moves: Record<string, () => void> = {
			ArrowLeft: () => (tx += step),
			ArrowRight: () => (tx -= step),
			ArrowUp: () => (ty += step),
			ArrowDown: () => (ty -= step),
			'+': () => zoomTo(zoom * 1.15),
			'=': () => zoomTo(zoom * 1.15),
			'-': () => zoomTo(zoom / 1.15)
		};
		if (!moves[e.key]) return;
		e.preventDefault();
		moves[e.key]();
		clamp();
	}
	function rotate(dir: 1 | -1) {
		rot = (rot + dir * 90 + 360) % 360;
		[tx, ty] = dir === 1 ? [-ty, tx] : [ty, -tx];
		clamp();
	}

	async function save() {
		if (!bmp) return;
		saving = true;
		const out = new OffscreenCanvas(OUT, OUT);
		draw(out.getContext('2d')! as unknown as CanvasRenderingContext2D, OUT);
		let blob = await out.convertToBlob({ type: 'image/webp', quality: 0.86 });
		// Safari lama tidak bisa menyandikan WebP → JPEG berlatar putih
		if (blob.type !== 'image/webp') {
			const jpg = new OffscreenCanvas(OUT, OUT);
			const ctx = jpg.getContext('2d')!;
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, OUT, OUT);
			ctx.drawImage(out, 0, 0);
			blob = await jpg.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
		}
		const ok = await onsave(blob);
		saving = false;
		if (ok) close();
	}
</script>

<dialog
	bind:this={dialog}
	{onclose}
	class="avatar-dialog m-auto w-[min(100%-2rem,24rem)] overflow-visible rounded-3xl bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/55 backdrop:backdrop-blur-sm max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none dark:bg-stone-900 dark:text-stone-100"
	aria-labelledby="avatar-dialog-title"
>
	<div class="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
		<h2 id="avatar-dialog-title" class="text-lg font-medium">Crop foto profil</h2>
		<p class="text-sm text-stone-500">Drag untuk mengatur posisi, scroll atau pinch untuk zoom. Zoom out penuh agar seluruh gambar masuk.</p>

		<div class="mt-4 grid place-items-center">
			{#if error}
				<p class="grid size-72 place-items-center rounded-full bg-rose-50 p-8 text-center text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>
			{:else}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
				<div
					class="crop relative size-72 cursor-grab touch-none overflow-hidden rounded-2xl bg-stone-100 outline-offset-4 dark:bg-stone-800 {dragging ? 'cursor-grabbing' : ''}"
					role="application"
					aria-label="Area crop foto. Panah untuk menggeser, plus dan minus untuk zoom."
					tabindex="0"
					onpointerdown={down}
					onpointermove={move}
					onpointerup={up}
					onpointercancel={up}
					onwheel={wheel}
					onkeydown={key}
				>
					<canvas bind:this={canvas} class="size-full" aria-hidden="true"></canvas>
					<!-- lingkaran hasil + bayangan di luar lingkaran -->
					<div class="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgb(12_10_9/0.55)] ring-2 ring-white/80"></div>
					<!-- garis sepertiga saat digeser -->
					<div class="thirds pointer-events-none absolute inset-0 rounded-full transition-opacity duration-200 {dragging ? 'opacity-100' : 'opacity-0'}"></div>
					{#if !bmp}
						<div class="absolute inset-0 grid place-items-center text-stone-400"><LoaderCircle class="size-6 animate-spin" /></div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="mt-4 flex items-center gap-2">
			<button class="btn btn-ghost btn-icon btn-sm" onclick={() => zoomTo(zoom / 1.25)} disabled={!bmp || zoom <= dims.min + 0.001} aria-label="Zoom out" {@attach tooltip()}><ZoomOut class="size-4" /></button>
			<input
				type="range"
				class="zoom-range flex-1"
				min={dims.min}
				max={MAX_ZOOM}
				step="0.01"
				value={zoom}
				oninput={(e) => zoomTo(Number(e.currentTarget.value))}
				disabled={!bmp}
				aria-label="Zoom"
				style="--p: {((zoom - dims.min) / (MAX_ZOOM - dims.min)) * 100}%"
			/>
			<button class="btn btn-ghost btn-icon btn-sm" onclick={() => zoomTo(zoom * 1.25)} disabled={!bmp || zoom >= MAX_ZOOM} aria-label="Zoom in" {@attach tooltip()}><ZoomIn class="size-4" /></button>
			<span class="mx-1 h-5 w-px bg-stone-200 dark:bg-stone-700"></span>
			<button class="btn btn-ghost btn-icon btn-sm" onclick={() => rotate(-1)} disabled={!bmp} aria-label="Rotate kiri" {@attach tooltip()}><RotateCcw class="size-4" /></button>
			<button class="btn btn-ghost btn-icon btn-sm" onclick={() => rotate(1)} disabled={!bmp} aria-label="Rotate kanan" {@attach tooltip()}><RotateCw class="size-4" /></button>
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<button class="btn btn-secondary" onclick={close} disabled={saving}>Batal</button>
			<button class="btn btn-primary min-w-24" onclick={save} disabled={!bmp || saving}>
				{#if saving}<LoaderCircle class="size-4 animate-spin" /> Menyimpan…{:else}Simpan foto{/if}
			</button>
		</div>
	</div>
</dialog>

<style>
	.avatar-dialog {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.18s ease,
			transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.1),
			overlay 0.22s allow-discrete,
			display 0.22s allow-discrete;
	}
	.avatar-dialog:not([open]) {
		opacity: 0;
		transform: translateY(12px) scale(0.97);
	}
	@starting-style {
		.avatar-dialog[open] {
			opacity: 0;
			transform: translateY(12px) scale(0.97);
		}
	}
	@media (max-width: 639px) {
		.avatar-dialog:not([open]) {
			transform: translateY(100%);
		}
		@starting-style {
			.avatar-dialog[open] {
				transform: translateY(100%);
			}
		}
	}
	.avatar-dialog::backdrop {
		transition:
			opacity 0.2s,
			overlay 0.2s allow-discrete,
			display 0.2s allow-discrete;
	}
	@starting-style {
		.avatar-dialog[open]::backdrop {
			opacity: 0;
		}
	}
	.thirds {
		background:
			linear-gradient(to right, transparent calc(33.33% - 0.5px), rgb(255 255 255 / 0.45) calc(33.33% - 0.5px) calc(33.33% + 0.5px), transparent calc(33.33% + 0.5px) calc(66.66% - 0.5px), rgb(255 255 255 / 0.45) calc(66.66% - 0.5px) calc(66.66% + 0.5px), transparent calc(66.66% + 0.5px)),
			linear-gradient(to bottom, transparent calc(33.33% - 0.5px), rgb(255 255 255 / 0.45) calc(33.33% - 0.5px) calc(33.33% + 0.5px), transparent calc(33.33% + 0.5px) calc(66.66% - 0.5px), rgb(255 255 255 / 0.45) calc(66.66% - 0.5px) calc(66.66% + 0.5px), transparent calc(66.66% + 0.5px));
	}
	.crop:focus-visible {
		outline: 2px solid var(--color-brand-400);
	}
	/* slider zoom bergaya aplikasi (bukan tampilan bawaan browser) */
	.zoom-range {
		appearance: none;
		height: 1.25rem;
		background: transparent;
		cursor: pointer;
	}
	.zoom-range::-webkit-slider-runnable-track {
		height: 4px;
		border-radius: 9999px;
		background: linear-gradient(to right, var(--color-brand-500) var(--p), var(--color-stone-200) var(--p));
	}
	.zoom-range::-moz-range-track {
		height: 4px;
		border-radius: 9999px;
		background: linear-gradient(to right, var(--color-brand-500) var(--p), var(--color-stone-200) var(--p));
	}
	:global(.dark) .zoom-range::-webkit-slider-runnable-track {
		background: linear-gradient(to right, var(--color-brand-400) var(--p), var(--color-stone-700) var(--p));
	}
	:global(.dark) .zoom-range::-moz-range-track {
		background: linear-gradient(to right, var(--color-brand-400) var(--p), var(--color-stone-700) var(--p));
	}
	.zoom-range::-webkit-slider-thumb {
		appearance: none;
		margin-top: -6px;
		width: 16px;
		height: 16px;
		border-radius: 9999px;
		background: #fff;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.08),
			0 1px 3px rgb(0 0 0 / 0.25);
		transition: transform 0.12s;
	}
	.zoom-range::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border: 0;
		border-radius: 9999px;
		background: #fff;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.08),
			0 1px 3px rgb(0 0 0 / 0.25);
	}
	.zoom-range:active::-webkit-slider-thumb {
		transform: scale(1.15);
	}
	.zoom-range:focus-visible {
		outline: 2px solid var(--color-brand-400);
		outline-offset: 2px;
		border-radius: 9999px;
	}
</style>
