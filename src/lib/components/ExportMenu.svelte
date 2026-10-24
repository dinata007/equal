<script lang="ts">
	/** Tombol Export → pilihan Excel / CSV / PDF. `table` dipanggil saat format dipilih (data selalu terbaru). */
	import { ChevronDown, Download, FileSpreadsheet, FileText, LoaderCircle, Sheet } from '@lucide/svelte';
	import { EXPORT_FORMATS, exportTable, type ExportFormat, type ExportTable } from '#lib/erp/export.ts';
	import { toast } from '#lib/erp/ui.svelte.ts';
	import Menu from './Menu.svelte';

	let {
		table,
		variant = 'default',
		class: cls = ''
	}: {
		table: () => ExportTable | Promise<ExportTable>;
		/** bar = di bar aksi massal (latar gelap) */
		variant?: 'default' | 'bar';
		class?: string;
	} = $props();

	const ICONS = { xlsx: FileSpreadsheet, csv: Sheet, pdf: FileText };
	let busy = $state<ExportFormat | null>(null);

	async function run(format: ExportFormat) {
		busy = format;
		try {
			const t = await table();
			if (!t.rows.length) return toast.info('Tidak ada data untuk di-export');
			await exportTable(format, t);
			toast.success(`Export ${EXPORT_FORMATS.find((f) => f.id === format)!.label} selesai · ${t.rows.length.toLocaleString('id-ID')} baris`);
		} catch (e) {
			console.error('[export]', e);
			toast.error('Export gagal. Coba lagi.');
		} finally {
			busy = null;
		}
	}
</script>

<Menu items={EXPORT_FORMATS.map((f) => ({ label: f.label, icon: ICONS[f.id], kbd: f.ext, onclick: () => run(f.id) }))}>
	{#snippet trigger(props)}
		<button
			{...props}
			disabled={!!busy}
			class={variant === 'bar'
				? `btn btn-sm text-white hover:bg-white/10 aria-expanded:bg-white/10 dark:text-stone-900 dark:hover:bg-stone-900/10 dark:aria-expanded:bg-stone-900/10 ${cls}`
				: `btn btn-secondary aria-expanded:bg-stone-50 dark:aria-expanded:bg-stone-800 ${cls}`}
		>
			{#if busy}<LoaderCircle class="{variant === 'bar' ? 'size-3.5' : 'size-4'} animate-spin" />{:else}<Download class={variant === 'bar' ? 'size-3.5' : 'size-4'} />{/if}
			<span class={variant === 'bar' ? '' : 'hidden sm:inline'}>Export</span>
			<ChevronDown class="size-3.5 opacity-60 {variant === 'bar' ? '' : 'max-sm:hidden'}" />
		</button>
	{/snippet}
	{#snippet header()}
		<p class="px-3 pt-1.5 pb-1 text-xs text-stone-500">Export sebagai</p>
	{/snippet}
</Menu>
