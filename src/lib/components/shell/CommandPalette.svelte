<script lang="ts">
	import { goto } from '$app/navigation';
	import { CornerDownLeft, Search } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { LEAVES } from '#lib/erp/menu.ts';
	import { shell } from '#lib/erp/ui.svelte.ts';
	import { backClose, leaving } from '#lib/ui/backClose.svelte.ts';

	backClose(() => shell.palette, () => (shell.palette = false));

	let q = $state('');
	let idx = $state(0);
	let listEl = $state<HTMLElement>();

	const allowed = $derived(LEAVES.filter((l) => auth.can(l.path)));
	const results = $derived.by(() => {
		const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
		if (!terms.length) return allowed.slice(0, 40);
		return allowed
			.map((l) => {
				const hay = l.trail.join(' ').toLowerCase();
				if (!terms.every((t) => hay.includes(t))) return null;
				const score = (l.label.toLowerCase().startsWith(terms[0]) ? 0 : 1) + l.trail.length * 0.01;
				return { l, score };
			})
			.filter((x) => !!x)
			.sort((a, b) => a.score - b.score)
			.map((x) => x.l);
	});

	$effect(() => {
		void q;
		idx = 0;
	});
	$effect(() => {
		if (!shell.palette) q = '';
	});

	function go(path: string) {
		// palette & drawer ditutup sambil pindah halaman: entri riwayatnya jangan ditarik (membatalkan goto)
		leaving();
		shell.palette = false;
		shell.drawer = false;
		goto(path);
	}
	function onkey(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			shell.palette = !shell.palette;
			return;
		}
		if (!shell.palette) return;
		if (e.key === 'Escape') shell.palette = false;
		else if (e.key === 'ArrowDown') {
			e.preventDefault();
			idx = Math.min(idx + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			idx = Math.max(idx - 1, 0);
		} else if (e.key === 'Enter' && results[idx]) go(results[idx].path);
		else return;
		requestAnimationFrame(() => listEl?.querySelector(`[data-i="${idx}"]`)?.scrollIntoView({ block: 'nearest' }));
	}
</script>

<svelte:window onkeydown={onkey} />

{#if shell.palette}
	<div class="fixed inset-0 z-[60] flex items-start justify-center sm:p-4 sm:pt-[12vh]">
		<button class="absolute inset-0 bg-stone-950/40 backdrop-blur-sm" transition:fade={{ duration: 120 }} onclick={() => (shell.palette = false)} aria-label="Tutup"></button>
		<div
			class="pt-safe relative flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[70vh] sm:max-w-xl sm:rounded-2xl sm:border sm:border-stone-200 dark:bg-stone-900 sm:dark:border-stone-800"
			transition:fly={{ y: -12, duration: 160 }}
			role="dialog"
			aria-modal="true"
			aria-label="Cari menu"
		>
			<div class="flex items-center gap-3 border-b border-stone-100 px-4 dark:border-stone-800">
				<Search class="size-5 text-stone-400" />
				<!-- svelte-ignore a11y_autofocus -->
				<input class="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-stone-400" placeholder="Cari menu, mis. 'kartu stok toko'" bind:value={q} autofocus />
				<button class="btn btn-ghost btn-sm sm:hidden" onclick={() => (shell.palette = false)}>Batal</button>
				<kbd class="hidden rounded border border-stone-200 px-1.5 text-[10px] text-stone-400 sm:inline dark:border-stone-700">ESC</kbd>
			</div>
			<ul class="flex-1 overflow-y-auto p-2" bind:this={listEl}>
				{#each results as l, i (l.path)}
					<li>
						<button
							data-i={i}
							class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left {i === idx ? 'bg-brand-50 dark:bg-brand-500/10' : ''}"
							onmouseenter={() => (idx = i)}
							onclick={() => go(l.path)}
						>
							<span class="grid size-9 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 {i === idx ? '!bg-brand-500 !text-white' : ''}">
								{#if l.icon}<l.icon class="size-4" />{/if}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium">{l.label}</span>
								<span class="block truncate text-xs text-stone-400">{l.trail.slice(0, -1).join(' › ')}</span>
							</span>
							{#if i === idx}<CornerDownLeft class="hidden size-4 text-stone-400 sm:block" />{/if}
						</button>
					</li>
				{:else}
					<li class="py-10 text-center text-sm text-stone-400">Menu tidak ditemukan</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
