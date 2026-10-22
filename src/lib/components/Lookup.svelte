<script lang="ts">
	/** Pilihan data master (supplier, produk, akun, …) — Select dengan pencarian kode/nama/barcode. */
	import { db } from '#lib/erp/db.svelte.ts';
	import type { Row } from '#lib/erp/types.ts';
	import Select, { type SelectOption } from './Select.svelte';

	let {
		value = $bindable(),
		table,
		filter,
		placeholder = 'Pilih…',
		disabled = false,
		clearable = false,
		compact = false,
		id,
		label,
		onselect
	}: {
		value?: string;
		table: string;
		filter?: (r: Row) => boolean;
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		compact?: boolean;
		id?: string;
		label?: string;
		onselect?: (r: Row | undefined) => void;
	} = $props();

	const sub = (r: Row) => r.category ?? r.city ?? r.type ?? r.position ?? r.channel ?? '';
	const options = $derived<SelectOption[]>(
		db
			.all(table)
			.filter((r) => (r.active !== false && (!filter || filter(r))) || r.id === value)
			.map((r) => ({
				value: r.id,
				label: r.name ?? r.username ?? r.no ?? r.id,
				hint: [r.code ?? r.nik, sub(r)].filter(Boolean).join(' · '),
				keywords: [r.code, r.nik, r.barcode, r.username].filter(Boolean).join(' ')
			}))
	);
	const display = (o: SelectOption) => db.label(table, String(o.value));
</script>

<Select
	bind:value={() => value ?? null, (v) => (value = v == null ? '' : String(v))}
	{options}
	{placeholder}
	{disabled}
	{clearable}
	{compact}
	{id}
	{label}
	{display}
	searchable
	emptyText="Belum ada data"
	onchange={(v) => onselect?.(v == null ? undefined : db.get(table, String(v)))}
/>
