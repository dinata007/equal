<script lang="ts" module>
	export interface RankItem {
		key: string;
		label: string;
		value: number;
		/** nilai periode pembanding (null = tanpa pembanding) */
		prev?: number | null;
		/** warna identitas (seri di grafik); tanpa warna = bar aksen */
		color?: string;
	}
</script>

<script lang="ts">
	/**
	 * Peringkat dengan bar horizontal, porsi % & perubahan vs periode pembanding. Baris bisa diklik (filter silang).
	 * Daftar panjang: tampil `limit` teratas, sisanya lewat "Tampilkan semua" (+ kolom cari bila banyak).
	 */
	import { Search } from '@lucide/svelte';
	import Delta from './Delta.svelte';

	let {
		items,
		fmt,
		selected = '',
		onselect,
		limit = 8,
		noun = 'data',
		wide = false
	}: {
		items: RankItem[];
		fmt: (v: number) => string;
		selected?: string;
		onselect?: (key: string) => void;
		limit?: number;
		noun?: string;
		/** dua kolom di layar lebar */
		wide?: boolean;
	} = $props();

	let all = $state(false);
	let q = $state('');
	const sum = $derived(items.reduce((s, i) => s + Math.max(0, i.value), 0));
	const max = $derived(Math.max(1, ...items.map((i) => Math.abs(i.value))));
	const found = $derived(q ? items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())) : items);
	// item terpilih tetap terlihat walau di luar `limit`
	const shown = $derived(all ? found.slice(0, 500) : found.filter((it, i) => i < limit || it.key === selected));
	const pct = (v: number) => (sum ? ((Math.max(0, v) / sum) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%' : '');
	const change = (it: RankItem) => (it.prev == null ? undefined : it.prev ? ((it.value - it.prev) / Math.abs(it.prev)) * 100 : null);
</script>

{#if all && items.length > 12}
	<label class="mb-2 flex h-8 items-center gap-2 rounded-lg border border-stone-200 px-2.5 text-sm focus-within:border-brand-400 dark:border-stone-700">
		<Search class="size-3.5 shrink-0 text-stone-400" />
		<input bind:value={q} class="min-w-0 flex-1 bg-transparent outline-none placeholder:text-stone-400" placeholder="Cari {noun}…" aria-label="Cari {noun}" />
	</label>
{/if}
<ul class="space-y-0.5 {wide ? 'lg:grid lg:grid-cols-2 lg:gap-x-8 lg:space-y-0' : ''} {all ? 'max-h-[26rem] overflow-y-auto overscroll-contain pr-1' : ''}">
	{#each shown as it (it.key)}
		{@const d = change(it)}
		<li>
			<button
				type="button"
				class="w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-stone-50 dark:hover:bg-stone-800/50 {selected === it.key ? 'bg-stone-100 dark:bg-stone-800' : ''} {selected && selected !== it.key ? 'opacity-50' : ''}"
				aria-pressed={selected === it.key}
				disabled={!onselect}
				onclick={() => onselect?.(it.key)}
			>
				<span class="flex items-baseline gap-2 text-sm">
					{#if it.color}<span class="size-2.5 shrink-0 translate-y-px self-center rounded-[3px]" style="background:{it.color}"></span>{/if}
					<span class="min-w-0 flex-1 truncate">{it.label}</span>
					<span class="shrink-0 font-medium tabular-nums">{fmt(it.value)}</span>
				</span>
				<span class="mt-1 flex items-center gap-2">
					<span class="h-1.5 flex-1 rounded-full" style="background:var(--viz-grid)">
						<span class="block h-1.5 rounded-full" style="width:{(Math.max(0, it.value) / max) * 100}%;background:{it.color ?? 'var(--viz-1)'}"></span>
					</span>
					<span class="w-11 shrink-0 text-right text-[11px] text-stone-400 tabular-nums">{pct(it.value)}</span>
					{#if d !== undefined}<span class="w-14 shrink-0 text-right"><Delta value={d} size="xs" /></span>{/if}
				</span>
			</button>
		</li>
	{:else}
		<li class="py-8 text-center text-sm text-stone-400">{q ? `Tidak ada ${noun} "${q}"` : 'Belum ada data'}</li>
	{/each}
</ul>
{#if items.length > limit}
	<button type="button" class="btn btn-ghost btn-sm mt-1 w-full" onclick={() => ((all = !all), (q = ''))}>
		{all ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${items.length.toLocaleString('id-ID')} ${noun})`}
	</button>
{/if}
