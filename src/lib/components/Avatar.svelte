<script lang="ts">
	/** Foto profil pengguna; tanpa foto (atau gagal dimuat) → inisial nama. */
	import { initials } from '#lib/erp/format.ts';

	let {
		id,
		name,
		ver = null,
		tone = 'brand',
		class: cls = 'size-9 text-xs'
	}: {
		id: number;
		name: string;
		/** versi foto (null = belum ada foto) */
		ver?: number | null;
		/** warna latar inisial */
		tone?: 'brand' | 'muted';
		class?: string;
	} = $props();

	const src = $derived(ver != null ? `/api/avatar/${id}?v=${ver}` : null);
	let failed = $state<string | null>(null);
</script>

<span
	class="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold select-none {tone === 'brand'
		? 'bg-brand-500 text-white'
		: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'} {cls}"
>
	{#if src && failed !== src}
		<img {src} alt="" class="size-full object-cover" decoding="async" onerror={() => (failed = src)} />
	{:else}
		{initials(name)}
	{/if}
</span>
