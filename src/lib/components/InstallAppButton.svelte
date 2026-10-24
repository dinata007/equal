<script lang="ts">
	/**
	 * Tombol "Install App" (Topbar & Login). Chrome/Edge/Android → dialog install bawaan browser;
	 * iPhone/iPad & Safari Mac (tanpa dialog) → popover panduan langkah. Tersembunyi bila sudah ter-install
	 * atau browser memang tidak bisa install (Firefox desktop, koneksi bukan HTTPS).
	 */
	import { Download, LoaderCircle, Share, SquarePlus, X } from '@lucide/svelte';
	import { pwa } from '#lib/erp/pwa.svelte.ts';
	import { toast } from '#lib/erp/ui.svelte.ts';
	import { float, uidEl } from '#lib/ui/floating.ts';
	import { tooltip } from '#lib/ui/tooltip.ts';

	let { variant = 'topbar' }: { variant?: 'topbar' | 'login' } = $props();

	const popId = uidEl('install');
	let btn = $state<HTMLButtonElement>();
	let pop = $state<HTMLDivElement>();
	let busy = $state(false);
	let stop: (() => void) | null = null;

	const visible = $derived(!pwa.standalone && !pwa.installedNow && (pwa.route === 'prompt' || pwa.route === 'ios' || pwa.route === 'mac-safari'));
	const sheet = matchMedia('(max-width: 639px)').matches;

	async function click() {
		if (pwa.route !== 'prompt') return pop?.togglePopover();
		busy = true;
		const r = await pwa.install();
		busy = false;
		if (r === 'accepted') toast.success('ruangSenja ter-install. Buka dari layar utama atau taskbar.');
	}
	function ontoggle(e: ToggleEvent) {
		stop?.();
		stop = null;
		if (e.newState === 'open' && !sheet) stop = float(btn!, pop!, { placement: variant === 'login' ? 'top' : 'bottom-end', gap: 8, maxHeight: 420 });
	}
</script>

{#if visible}
	{#if variant === 'topbar'}
		<button
			bind:this={btn}
			class="btn btn-secondary rounded-full max-sm:w-8 max-sm:rounded-lg max-sm:border-0 max-sm:bg-transparent max-sm:px-0 max-sm:shadow-none"
			onclick={click}
			disabled={busy}
			aria-label="Install App"
			aria-haspopup={pwa.route === 'prompt' ? undefined : 'dialog'}
			{@attach tooltip('Install ruangSenja di perangkat ini', { placement: 'bottom' })}
		>
			{#if busy}<LoaderCircle class="size-4 animate-spin" />{:else}<Download class="size-4 max-sm:size-5" />{/if}
			<span class="max-sm:hidden">Install App</span>
		</button>
	{:else}
		<button
			bind:this={btn}
			class="group flex w-full items-center gap-3 rounded-2xl border border-stone-200 bg-white/70 p-3 text-left transition hover:border-brand-300 hover:bg-white dark:border-stone-800 dark:bg-stone-900/60 dark:hover:border-brand-700 dark:hover:bg-stone-900"
			onclick={click}
			disabled={busy}
			aria-haspopup={pwa.route === 'prompt' ? undefined : 'dialog'}
		>
			<img src="/icon-192.png" alt="" class="size-10 rounded-xl shadow-sm ring-1 ring-stone-900/5" />
			<span class="min-w-0 flex-1">
				<span class="block text-sm font-medium">Install App</span>
				<span class="block text-xs text-stone-500">Buka ruangSenja langsung dari layar utama atau taskbar</span>
			</span>
			<span class="grid size-9 shrink-0 place-items-center rounded-full bg-stone-900 text-white transition group-hover:scale-105 dark:bg-stone-100 dark:text-stone-900">
				{#if busy}<LoaderCircle class="size-4 animate-spin" />{:else}<Download class="size-4" />{/if}
			</span>
		</button>
	{/if}

	{#if pwa.route !== 'prompt'}
		<div
			bind:this={pop}
			id={popId}
			popover="auto"
			{ontoggle}
			role="dialog"
			aria-label="Cara install ruangSenja"
			class="pop z-[90] w-80 rounded-2xl border border-stone-200 bg-white p-4 text-stone-900 shadow-xl dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 {sheet ? 'pop-sheet rounded-b-none pb-safe' : ''}"
		>
			<div class="mb-3 flex items-center gap-3">
				<img src="/icon-192.png" alt="" class="size-10 rounded-xl ring-1 ring-stone-900/5" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium">Install ruangSenja</p>
					<p class="text-xs text-stone-500">{pwa.route === 'ios' ? 'iPhone / iPad' : 'Safari di Mac'}</p>
				</div>
				<button class="btn btn-ghost btn-icon btn-sm -mr-1" onclick={() => pop?.hidePopover()} aria-label="Tutup"><X class="size-4" /></button>
			</div>
			{#if pwa.route === 'ios'}
				<ol class="space-y-2.5 text-sm text-stone-600 dark:text-stone-300">
					<li class="flex items-start gap-3"><span class="step">1</span><span class="pt-0.5">Buka halaman ini di <b class="font-medium">Safari</b></span></li>
					<li class="flex items-start gap-3"><span class="step">2</span><span class="pt-0.5">Ketuk <Share class="inline size-4 -translate-y-px text-sky-600" /> <b class="font-medium">Share</b> (Bagikan) di bawah layar</span></li>
					<li class="flex items-start gap-3"><span class="step">3</span><span class="pt-0.5">Pilih <SquarePlus class="inline size-4 -translate-y-px" /> <b class="font-medium">Add to Home Screen</b> (Tambahkan ke Layar Utama), lalu <b class="font-medium">Add</b></span></li>
				</ol>
			{:else}
				<ol class="space-y-2.5 text-sm text-stone-600 dark:text-stone-300">
					<li class="flex items-start gap-3"><span class="step">1</span><span class="pt-0.5">Buka menu <b class="font-medium">File</b> di Safari</span></li>
					<li class="flex items-start gap-3"><span class="step">2</span><span class="pt-0.5">Pilih <b class="font-medium">Add to Dock</b> (Tambahkan ke Dock), lalu <b class="font-medium">Add</b></span></li>
				</ol>
				<p class="mt-3 text-xs text-stone-400">Perlu macOS Sonoma atau lebih baru.</p>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.step {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		border-radius: 9999px;
		background: var(--color-brand-500);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 600;
	}
</style>
