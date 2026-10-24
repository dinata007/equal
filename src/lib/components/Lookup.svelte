<script lang="ts">
	/**
	 * Pilihan data master (supplier, produk, akun, …) — Select dengan pencarian kode/nama/barcode.
	 * Sumber: tabel prototipe (`table`) atau lookup server (`source`, master dari database).
	 */
	import { db } from '#lib/erp/db.svelte.ts';
	import { lookups } from '#lib/erp/lookups.svelte.ts';
	import type { Row } from '#lib/erp/types.ts';
	import Select, { type SelectOption } from './Select.svelte';

	let {
		value = $bindable(),
		table,
		source,
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
		table?: string;
		source?: string;
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
	const rows = $derived.by<Row[]>(() => {
		if (!source) return db.all(table!);
		const list = lookups.options(source);
		// kode lama yang tidak ada lagi di tabel acuannya tetap ditampilkan apa adanya
		return value && list.length && !lookups.get(source, value) ? [...list, { id: value, code: value, name: value, hint: 'tidak ditemukan', active: true }] : list;
	});
	/**
	 * Kode lookup bisa sama di beberapa brand/site (mis. jenis COA `ZZ` per brand, akun per site):
	 * pilihan = yang lolos filter, ditambah nilai terpilih hanya bila belum ada — diambil dari baris
	 * yang cocok dengan filter (brand/site data ini) agar tidak ganda dan labelnya tidak milik brand lain.
	 */
	const picked = $derived.by<Row[]>(() => {
		const fits = (r: Row) => !filter || filter(r);
		const list = rows.filter((r) => r.active !== false && fits(r));
		if (value && !list.some((r) => r.id === value)) {
			const cur = rows.find((r) => r.id === value && fits(r)) ?? rows.find((r) => r.id === value);
			if (cur) list.push(cur);
		}
		return list;
	});
	const options = $derived<SelectOption[]>(
		picked
			.map((r) =>
				source
					? { value: r.id, label: r.name || r.code, hint: [r.code !== r.name ? r.code : '', r.hint].filter(Boolean).join(' · '), keywords: r.code }
					: {
							value: r.id,
							label: r.name ?? r.username ?? r.no ?? r.id,
							hint: [r.code ?? r.nik, sub(r)].filter(Boolean).join(' · '),
							keywords: [r.code, r.nik, r.barcode, r.username].filter(Boolean).join(' ')
						}
			)
	);
	/** baris pilihan dengan kode ini (dari daftar terfilter, bukan baris pertama dengan kode sama di brand lain) */
	const pickedRow = (v: unknown) => picked.find((r) => r.id === v);
	const display = (o: SelectOption) => {
		if (!source) return db.label(table!, String(o.value));
		const r = pickedRow(o.value);
		return r ? (r.code && r.code !== r.name ? `${r.code} — ${r.name}` : r.name) : lookups.label(source, o.value);
	};
	const find = (v: string) => (source ? (pickedRow(v) ?? lookups.get(source, v)) : db.get(table!, v));
</script>

<Select
	bind:value={() => value || null, (v) => (value = v == null ? '' : String(v))}
	{options}
	{placeholder}
	{disabled}
	{clearable}
	{compact}
	{id}
	{label}
	{display}
	searchable
	emptyText={source && !rows.length ? 'Memuat…' : 'Belum ada data'}
	onchange={(v) => onselect?.(v == null ? undefined : find(String(v)))}
/>
