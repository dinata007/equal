<script lang="ts">
	import DateInput from '#lib/components/ui/DateInput.svelte';
	import PeriodPresets from '#lib/components/ui/PeriodPresets.svelte';
	import Select from '#lib/components/ui/Select.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Pencil, Plus, Trash, Trash2 } from '@lucide/svelte';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { db } from '#lib/dev-data/db.svelte.ts';
	import { addDays, date as fdate, money, num, today } from '#lib/util/format.ts';
	import { tableOf } from '#lib/util/export.ts';
	import ExportMenu from '#lib/components/data/ExportMenu.svelte';
	import type { Leaf } from '#lib/domain/menu.ts';
	import type { Doc, DocStatus, TxDef } from '#lib/domain/types.ts';
	import DataTable from '#lib/components/data/DataTable.svelte';
	import PageHeader from '#lib/components/data/PageHeader.svelte';
	import StatusBadge from '#lib/components/ui/StatusBadge.svelte';
	import type { BulkAction, Col } from '#lib/components/data/types.ts';
	import { ask, toast } from '#lib/state/ui.svelte.ts';
	import { api, ApiError } from '#lib/util/api.ts';
	import { loadSession, saveSession } from '#lib/components/data/grid/core.ts';
	import TxForm from './TxForm.svelte';
	import TokoPenjualanForm from './TokoPenjualanForm.svelte';

	let { leaf }: { leaf: Leaf } = $props();

	const def = $derived(leaf.page as TxDef);
	const salesLineList = $derived(def.listLayout === 'sales-lines');
	const docId = $derived(salesLineList ? null : page.url.searchParams.get('id'));
	const canCreate = $derived(auth.can(leaf.path, 'create'));
	const canDelete = $derived(!salesLineList && auth.can(leaf.path, 'delete'));
	const canDeleteSales = $derived(salesLineList && auth.admin);

	let query = $state('');
	// periode & tab status diingat selama aplikasi terbuka
	// svelte-ignore state_referenced_locally
	const sKey = `senja:page:${auth.user?.id ?? 'anon'}:${leaf.path}`;
	const s0 = loadSession(sKey, { from: addDays(today(), -30), to: today(), status: 'all' as 'all' | DocStatus, store: '', payment: '', salesView: 'Detail' as 'Detail' | 'Rekap' | 'Rekap Pembayaran' | 'Rekap Omzet' });
	let from = $state(s0.from);
	let to = $state(s0.to);
	let status = $state<'all' | DocStatus>(s0.status);
	let storeFilter = $state(s0.store);
	let paymentFilter = $state(s0.payment);
	let salesView = $state(s0.salesView);
	let liveSalesRows = $state<Doc[]>([]);
	let liveStores = $state<{ value: string; label: string }[]>([]);
	let salesLoading = $state(false);
	let salesError = $state('');
	let salesReload = $state(0);
	let selectedSale = $state<Doc | null>(null);
	let showSaleForm = $state(false);
	let saleFormRows = $state<Doc[]>([]);
	let salesRequest = 0;
	$effect(() => saveSession(sKey, { from, to, status, store: storeFilter, payment: paymentFilter, salesView }));

	const salesViews = [
		{ value: 'Detail', label: 'Detail' },
		{ value: 'Rekap', label: 'Rekap' },
		{ value: 'Rekap Pembayaran', label: 'Rekap Pembayaran' },
		{ value: 'Rekap Omzet', label: 'Rekap Omzet' }
	];
	$effect(() => {
		if (!salesLineList) return;
		void salesReload;
		const requestId = ++salesRequest;
		const params = new URLSearchParams({ from, to, store: storeFilter, payment: paymentFilter });
		salesLoading = true;
		salesError = '';
		liveSalesRows = [];
		selectedSale = null;
		api<{ rows: Doc[]; stores: { value: string; label: string }[] }>(`/api/toko/penjualan?${params}`)
			.then((result) => {
				if (requestId !== salesRequest) return;
				liveSalesRows = result.rows;
				liveStores = result.stores;
			})
			.catch((error) => {
				if (requestId !== salesRequest) return;
				liveSalesRows = [];
				salesError = error instanceof ApiError ? error.message : 'Gagal memuat transaksi penjualan dari database';
			})
			.finally(() => {
				if (requestId === salesRequest) salesLoading = false;
			});
	});

	const all = $derived(salesLineList ? liveSalesRows : db.all<Doc>(def.table));
	const paymentType = (payment: string) => {
		const normalized = payment.toLocaleUpperCase();
		if (normalized === 'TUNAI' || normalized === 'CASH') return 'CASH';
		if (normalized === 'DEBIT' || normalized === 'QRIS') return 'DEBIT';
		if (normalized === 'KARTU KREDIT' || normalized === 'CREDIT') return 'CREDIT';
		if (normalized === 'TRANSFER') return 'TRANSFER';
		if (normalized === 'BOOKING') return 'BOOKING';
		if (normalized === 'UTANG' || normalized === 'KREDIT') return 'UTANG';
		return payment;
	};
	const scopedRows = $derived(
		all.filter(
			(d) =>
				d.date >= from &&
				d.date <= to &&
				(!salesLineList || (!storeFilter || d.storeId === storeFilter) && (!paymentFilter || paymentType(String(d.payment ?? '')) === paymentFilter))
		)
	);
	const rows = $derived(salesLineList ? scopedRows : scopedRows.filter((d) => status === 'all' || d.status === status));
	const detailRows = $derived<Doc[]>(salesLineList ? rows : []);
	const listRows = $derived.by<Doc[]>(() => {
		if (!salesLineList) return rows;
		if (salesView === 'Detail') return detailRows;
		if (salesView === 'Rekap') {
			const docs = new Map<string, Doc>();
			for (const line of detailRows) {
				const key = String(line.documentId);
				const doc = docs.get(key) ?? {
					...line,
					id: key,
					no: line.no,
					qty: 0,
					discountAmount: 0,
					totalLine: 0,
					wholesaleTotal: 0,
					barcodeTotal: 0
				};
				doc.qty += Number(line.qty) || 0;
				doc.discountAmount += Number(line.discountAmount) || 0;
				doc.totalLine += Number(line.totalLine) || 0;
				doc.wholesaleTotal += Number(line.wholesaleTotal) || 0;
				doc.barcodeTotal += Number(line.barcodeTotal) || 0;
				docs.set(key, doc);
			}
			return [...docs.values()];
		}

		const grouped = new Map<string, Doc>();
		for (const line of detailRows) {
			const key = salesView === 'Rekap Omzet' ? line.date : `${line.date}:${paymentType(String(line.payment ?? ''))}`;
			const entry = grouped.get(key) ?? {
				...line,
				id: key,
				no: salesView === 'Rekap Omzet' ? line.date : paymentType(String(line.payment ?? '')),
				customerName: salesView === 'Rekap Omzet' ? 'Semua Pembayaran' : paymentType(String(line.payment ?? '')),
				paymentType: salesView === 'Rekap Omzet' ? 'Semua' : paymentType(String(line.payment ?? '')),
				docCount: 0,
				documents: new Set<string>(),
				qty: 0,
				discountAmount: 0,
				totalLine: 0,
				wholesaleTotal: 0,
				barcodeTotal: 0,
				lines: []
			};
			const documents = entry.documents as Set<string>;
			const docId = String(line.documentId);
			if (!documents.has(docId)) {
				documents.add(docId);
				entry.docCount += 1;
			}
			entry.qty += Number(line.qty) || 0;
			entry.discountAmount += Number(line.discountAmount) || 0;
			entry.totalLine += Number(line.totalLine) || 0;
			entry.wholesaleTotal += Number(line.wholesaleTotal) || 0;
			entry.barcodeTotal += Number(line.barcodeTotal) || 0;
			grouped.set(key, entry);
		}
		return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date) || a.no.localeCompare(b.no));
	});
	const counts = $derived({
		all: scopedRows.length,
		draft: scopedRows.filter((d) => d.status === 'draft').length
	});
	const sum = $derived(rows.filter((d) => d.status === 'posted').reduce((s, d) => s + (d.total ?? 0), 0));
	const party = (d: Doc) => (def.party ? db.name(def.party.ref, d[def.party.field]) : (d.memo ?? ''));

	const columns = $derived<Col<Doc>[]>(
		salesLineList
			? salesView === 'Detail'
				? [
					{ key: 'rowNo', label: 'No', align: 'center', value: (d) => d.rowNo },
					{ key: 'no', label: 'Bukti', cell: noCell },
					{ key: 'date', label: 'Tgl', format: fdate },
					{ key: 'customerName', label: 'Nama' },
					{ key: 'island', label: 'Pulau' },
					{ key: 'province', label: 'Propinsi' },
					{ key: 'remark', label: 'Remark' },
					{ key: 'paymentType', label: 'Tipe Transaksi' },
					{ key: 'productCode', label: 'ID Artikel' },
					{ key: 'productName', label: 'Nama Artikel' },
					{ key: 'wholesalePrice', label: 'Harga Grosir', align: 'right', format: money },
					{ key: 'barcodePrice', label: 'Harga Barcode', align: 'right', format: money },
					{ key: 'qty', label: 'Qty', align: 'right', format: num },
					{ key: 'discPct', label: 'Disc (%)', align: 'right', format: num },
					{ key: 'subtotalLine', label: 'Sub Total', align: 'right', format: money },
					{ key: 'discountAmount', label: 'Disc (Rp)', align: 'right', format: money },
					{ key: 'wholesaleTotal', label: 'Total Grosir', align: 'right', format: money },
					{ key: 'barcodeTotal', label: 'Total Barcode', align: 'right', format: money },
					{ key: 'status', label: 'Status', value: (d) => statusLabel(d.status), cell: statusCell }
				]
				: salesView === 'Rekap'
					? [
						{ key: 'no', label: 'Bukti', cell: noCell },
						{ key: 'date', label: 'Tgl', format: fdate },
						{ key: 'customerName', label: 'Nama' },
						{ key: 'island', label: 'Pulau' },
						{ key: 'province', label: 'Propinsi' },
						{ key: 'paymentType', label: 'Pembayaran' },
						{ key: 'remark', label: 'Remark' },
						{ key: 'qty', label: 'Qty', align: 'right', format: num },
						{ key: 'discountAmount', label: 'Disc (Rp)', align: 'right', format: money },
						{ key: 'wholesaleTotal', label: 'Total Grosir', align: 'right', format: money },
						{ key: 'barcodeTotal', label: 'Total Barcode', align: 'right', format: money }
					]
					: [
						{ key: 'date', label: 'Tgl', format: fdate },
						{ key: 'paymentType', label: 'Tipe Pembayaran' },
						{ key: 'docCount', label: 'Jumlah Transaksi', align: 'right', format: num },
						{ key: 'qty', label: 'Qty', align: 'right', format: num },
						{ key: 'discountAmount', label: 'Disc (Rp)', align: 'right', format: money },
						{ key: 'wholesaleTotal', label: 'Omzet Grosir', align: 'right', format: money },
						{ key: 'barcodeTotal', label: 'Omzet Barcode', align: 'right', format: money }
					]
			: [
					{ key: 'no', label: 'No. Dokumen', cell: noCell },
					{ key: 'date', label: 'Tanggal', format: fdate },
					...(def.party ? [{ key: 'party', label: def.party.label, value: party }] : [{ key: 'memo', label: 'Uraian', value: party }]),
					...(def.source ? [{ key: 'src', label: 'Referensi', value: (d: Doc) => db.get(def.source!.table, d.sourceId)?.no ?? '', class: 'font-mono text-xs text-stone-500' }] : []),
					{ key: 'lines', label: 'Item', align: 'center' as const, value: (d: Doc) => d.lines.length },
					...(def.noAmount ? [] : [{ key: 'total', label: 'Total', align: 'right' as const, value: (d: Doc) => d.total ?? 0, format: money, sum: true }]),
					{ key: 'status', label: 'Status', value: (d: Doc) => statusLabel(d.status), cell: statusCell }
				]
	);
	const statusLabel = (s: DocStatus) => statuses.find((x) => x.key === s)?.label ?? s;
	const storeOptions = $derived([
		{ value: '', label: 'Semua Toko' },
		...liveStores
	]);
	const paymentOptions = [
		{ value: '', label: 'All' },
		{ value: 'CASH', label: 'CASH' },
		{ value: 'DEBIT', label: 'DEBIT' },
		{ value: 'CREDIT', label: 'CREDIT' },
		{ value: 'TRANSFER', label: 'TRANSFER' },
		{ value: 'BOOKING', label: 'BOOKING' },
		{ value: 'UTANG', label: 'UTANG' },
		{ value: 'PACKING', label: 'PACKING' },
		{ value: 'BATAL', label: 'BATAL' }
	];

	const bulk = $derived<BulkAction<Doc>[]>(
		canDelete ? [{ label: 'Hapus draft', icon: Trash, danger: true, when: (d: Doc) => d.status === 'draft', run: removeDrafts }] : []
	);
	async function removeDrafts(ds: Doc[]) {
		const ids = [...new Set(ds.map((d) => String(d.documentId ?? d.id)))];
		const docs = ids.map((id) => db.get<Doc>(def.table, id)).filter((d): d is Doc => !!d);
		if (!(await ask({ title: `Hapus ${docs.length} draft?`, message: docs.slice(0, 5).map((d) => d.no).join(', ') + (docs.length > 5 ? ', …' : ''), danger: true, confirmText: 'Hapus' }))) return false;
		for (const d of docs) await db.remove(def.table, d.id);
		toast.success(`${docs.length} draft dihapus`);
	}

	const statuses: { key: 'all' | DocStatus; label: string }[] = $derived([
		{ key: 'all', label: 'Semua' },
		{ key: 'draft', label: def.statusLabels?.draft ?? 'Draft' },
		{ key: 'posted', label: def.statusLabels?.posted ?? 'Posted' },
		{ key: 'void', label: def.statusLabels?.void ?? 'Batal' }
	]);

	const open = (d: Doc) => goto(`${leaf.path}?id=${d.documentId ?? d.id}`);
	function selectSalesRow(row: Doc) {
		selectedSale = row;
	}
	function createSale() {
		saleFormRows = [];
		showSaleForm = true;
	}
	function editSale() {
		if (!selectedSale || salesView !== 'Detail') return;
		saleFormRows = liveSalesRows.filter((row) => row.documentId === selectedSale?.documentId);
		showSaleForm = saleFormRows.length > 0;
	}
	async function deleteSale() {
		if (!selectedSale || selectedSale.paymentType !== 'BOOKING') return;
		if (!(await ask({ title: `Hapus booking ${selectedSale.no}?`, message: 'Detail transaksi ini akan ikut dihapus.', danger: true, confirmText: 'Hapus' }))) return;
		try {
			const params = new URLSearchParams({ store: selectedSale.storeId, documentId: selectedSale.documentId });
			await api(`/api/toko/penjualan?${params}`, { method: 'DELETE' });
			toast.success(`Booking ${selectedSale.no} dihapus`);
			salesReload += 1;
		} catch (error) {
			toast.error(error instanceof ApiError ? error.message : 'Gagal menghapus booking');
		}
	}
	function saleFormSaved() {
		showSaleForm = false;
		selectedSale = null;
		salesReload += 1;
	}

	const STATUS_LABEL: Record<string, string> = { draft: 'Draft', posted: 'Posted', void: 'Void' };
	function exportData() {
		if (salesLineList) {
			return {
				...tableOf(
					`${leaf.label} ${salesView} ${from} sd ${to}`,
					columns.map((col) => col.label),
					listRows.map((d) => columns.map((col) => col.value?.(d) ?? d[col.key] ?? ''))
				),
				title: `${leaf.label} · ${salesView}`,
				subtitle: `${fdate(from)} – ${fdate(to)} · ${listRows.length} baris`
			};
		}
		return {
			...tableOf(`${leaf.label} ${from} sd ${to}`, ['No', 'Tanggal', def.party?.label ?? 'Uraian', 'Item', 'Total', 'Status'], rows.map((d) => [d.no, d.date, party(d), d.lines.length, d.total ?? 0, STATUS_LABEL[d.status] ?? d.status])),
			title: leaf.label,
			subtitle: `${fdate(from)} – ${fdate(to)} · ${rows.length} dokumen`,
			totals: ['Total', '', '', rows.reduce((s, d) => s + d.lines.length, 0), rows.reduce((s, d) => s + (d.total ?? 0), 0), '']
		};
	}
</script>

{#snippet noCell(d: Doc)}
	<span class="font-mono text-xs font-semibold text-stone-700 dark:text-stone-300">{d.no}</span>
{/snippet}
{#snippet statusCell(d: Doc)}
	<StatusBadge status={d.status} labels={def.statusLabels} />
{/snippet}
{#snippet card(d: Doc)}
	<div class="flex items-start gap-3">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<span class="truncate font-mono text-xs font-semibold">{d.no}</span>
				<StatusBadge status={d.status} labels={def.statusLabels} />
			</div>
			{#if salesLineList}
				<p class="mt-0.5 truncate text-sm font-medium">{d.customerName || '—'}{salesView === 'Detail' && d.province ? ` · ${d.province}` : ''}</p>
				{#if salesView === 'Detail'}
					<p class="truncate text-xs text-stone-500">{d.productCode || d.productName ? `${d.productCode} · ${d.productName}` : 'Tidak ada detail artikel'}</p>
					<p class="text-xs text-stone-500">{fdate(d.date)} · {num(d.qty)} × {money(d.wholesalePrice)} · Total {money(d.totalLine)}</p>
				{:else}
					<p class="text-xs text-stone-500">{fdate(d.date)} · {num(d.docCount ?? 1)} transaksi · Qty {num(d.qty)}</p>
				{/if}
			{:else}
				<p class="mt-0.5 truncate text-sm font-medium">{party(d) || '—'}</p>
				<p class="text-xs text-stone-500">{fdate(d.date)} · {d.lines.length} item</p>
			{/if}
		</div>
		{#if !def.noAmount}<p class="text-sm font-semibold tabular-nums">{money(salesLineList ? d.totalLine : d.total)}</p>{/if}
	</div>
{/snippet}

{#if docId}
	{#key docId}
		<TxForm {leaf} {docId} />
	{/key}
{:else}
	<PageHeader title={salesLineList ? 'Transaksi Penjualan' : leaf.label} subtitle={leaf.trail.slice(0, -1).join(' › ')} icon={leaf.icon}>
		{#snippet actions()}
			<ExportMenu table={exportData} class="hidden sm:inline-flex" />
			{#if canCreate && !salesLineList}<a href="{leaf.path}?id=new" class="btn btn-primary hidden sm:inline-flex"><Plus class="size-4" /> Buat Baru</a>{/if}
		{/snippet}
	</PageHeader>

	{#if !salesLineList}
	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="card p-4">
			<p class="text-xs text-stone-500">Dokumen</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums">{counts.all}</p>
		</div>
		<div class="card p-4">
			<p class="text-xs text-stone-500">Menunggu ({def.statusLabels?.draft ?? 'Draft'})</p>
			<p class="mt-1 text-2xl font-semibold text-amber-600 tabular-nums">{counts.draft}</p>
		</div>
		{#if !def.noAmount}
			<div class="card col-span-2 p-4">
				<p class="text-xs text-stone-500">Nilai {def.statusLabels?.posted ?? 'Posted'} (filter aktif)</p>
				<p class="mt-1 text-2xl font-semibold tracking-tight tabular-nums">Rp {money(sum)}</p>
			</div>
		{/if}
	</div>
	{/if}

	<div class="card overflow-clip">
		{#if salesLineList && salesError}
			<p class="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">{salesError}</p>
		{/if}
		<DataTable rows={listRows} {columns} bind:query {card} {bulk} smallText={salesLineList} onrow={salesLineList ? selectSalesRow : open} rowClass={(d) => salesLineList && selectedSale?.documentId === d.documentId ? 'bg-amber-50 dark:bg-amber-950/30' : ''} rowKey={(d) => d.id} initialSort={salesLineList ? [{ key: 'date', dir: 1 }, { key: 'no', dir: -1 }, { key: 'rowNo', dir: 1 }] : { key: 'no', dir: -1 }} searchPlaceholder={salesLineList ? 'Cari bukti / customer / artikel…' : 'Cari nomor / pihak…'} exportName="{leaf.label} {from} sd {to}" empty={salesLoading ? 'Memuat transaksi dari database…' : 'Belum ada dokumen pada periode ini'}>
			{#snippet toolbar()}
				<div class="flex flex-col gap-2 @3xl:flex-row @3xl:flex-wrap @3xl:items-center">
					{#if salesLineList}
						<div class="flex flex-wrap gap-2">
							{#if canCreate}<button class="btn btn-primary" onclick={createSale} disabled={!liveStores.length || salesLoading}><Plus class="size-4" /> New</button>{/if}
							{#if canCreate}<button class="btn btn-secondary" onclick={editSale} disabled={!selectedSale || salesView !== 'Detail' || selectedSale.status === 'void'}><Pencil class="size-4" /> Edit</button>{/if}
							{#if canDeleteSales}<button class="btn btn-secondary text-rose-700" onclick={deleteSale} disabled={!selectedSale || salesView !== 'Detail' || selectedSale.paymentType !== 'BOOKING'}><Trash2 class="size-4" /> Delete</button>{/if}
						</div>
					{/if}
					<div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2 @3xl:flex">
						<div class="min-w-0 @3xl:w-48"><DateInput bind:value={from} max={to} ariaLabel="Dari tanggal" /></div>
						<span class="text-stone-400">–</span>
						<div class="min-w-0 @3xl:w-48"><DateInput bind:value={to} min={from} ariaLabel="Sampai tanggal" /></div>
						<PeriodPresets bind:from bind:to />
					</div>
					{#if salesLineList}
						<div class="grid grid-cols-2 gap-2 @3xl:flex">
							<div class="min-w-0 @3xl:w-48"><Select bind:value={salesView} options={salesViews} compact label="Tampilan" /></div>
							<div class="min-w-0 @3xl:w-44"><Select bind:value={storeFilter} options={storeOptions} compact label="Toko" /></div>
							<div class="min-w-0 @3xl:w-48"><Select bind:value={paymentFilter} options={paymentOptions} compact label="Tipe Pembayaran" /></div>
						</div>
					{/if}
					{#if !salesLineList}
					<div class="flex gap-1 self-start overflow-x-auto rounded-xl bg-stone-100 p-1 @3xl:ml-auto @6xl:ml-0 dark:bg-stone-800/60">
						{#each statuses as s (s.key)}
							<button
								class="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition {status === s.key ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500'}"
								onclick={() => (status = s.key)}>{s.label}</button
							>
						{/each}
					</div>
					{/if}
				</div>
			{/snippet}
		</DataTable>
	</div>

	{#if canCreate && !salesLineList}
		<a href="{leaf.path}?id=new" class="btn btn-primary fixed right-4 bottom-24 z-20 size-11 rounded-xl p-0 shadow-lg shadow-stone-900/20 sm:hidden" aria-label="Buat baru">
			<Plus class="size-5" />
		</a>
	{/if}
{/if}

	{#if salesLineList && showSaleForm}
		<TokoPenjualanForm stores={liveStores} selectedStore={storeFilter} rows={saleFormRows} onClose={() => (showSaleForm = false)} onSaved={saleFormSaved} />
	{/if}
