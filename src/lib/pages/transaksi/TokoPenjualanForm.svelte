<script lang="ts">
	import { Plus, Trash, X } from '@lucide/svelte';
	import { api, ApiError } from '#lib/util/api.ts';
	import { today } from '#lib/util/format.ts';
	import { ask, toast } from '#lib/state/ui.svelte.ts';

	type Store = { value: string; label: string };
	type Customer = { value: string; label: string; grosir: boolean };
	type Bank = { value: string; label: string };
	type Row = {
		documentId?: string;
		date?: string;
		storeId?: string;
		customerId?: string;
		customerName?: string;
		remark?: string;
		productCode?: string;
		productName?: string;
		qty?: number;
		wholesalePrice?: number;
		barcodePrice?: number;
		discPct?: number;
		paymentType?: string;
		bankId?: string;
		bankInternal?: string;
		norek?: string;
		noRef?: string;
		dueDate?: string;
		paymentStatus?: string;
		cash?: number;
		debit?: number;
		credit?: number;
		transfer?: number;
	};
	type Line = {
		productId: string;
		name: string;
		qty: number;
		price: number;
		barcodePrice: number;
		discPct: number;
	};

	let { stores, selectedStore, rows, onClose, onSaved }: {
		stores: Store[];
		selectedStore: string;
		rows: Row[];
		onClose: () => void;
		onSaved: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const first = rows[0];
	// svelte-ignore state_referenced_locally
	let storeId = $state(first?.storeId ?? selectedStore ?? stores[0]?.value ?? '');
	let customerId = $state(first?.customerId ?? '');
	let date = $state(first?.date ?? today());
	let remark = $state(first?.remark ?? '');
	let paymentType = $state(first?.paymentType ?? 'BOOKING');
	let bankId = $state(first?.bankId ?? '');
	let bankInternal = $state(first?.bankInternal ?? '');
	let norek = $state(first?.norek ?? '');
	let noRef = $state(first?.noRef ?? '');
	let dueDate = $state(first?.dueDate ?? '');
	let paymentStatus = $state(first?.paymentStatus === 'T' ? 'T' : 'C');
	let cash = $state(first?.cash ?? 0);
	let debit = $state(first?.debit ?? 0);
	let credit = $state(first?.credit ?? 0);
	let transfer = $state(first?.transfer ?? 0);
	// svelte-ignore state_referenced_locally
	let lines = $state<Line[]>(rows.map((row) => ({
		productId: row.productCode ?? '',
		name: row.productName ?? '',
		qty: Number(row.qty) || 0,
		price: Number(row.wholesalePrice) || 0,
		barcodePrice: Number(row.barcodePrice) || 0,
		discPct: Number(row.discPct) || 0
	})));
	let customers = $state<Customer[]>([]);
	let banks = $state<Bank[]>([]);
	let newProductId = $state('');
	let loading = $state(false);
	let optionsLoading = $state(false);
	let error = $state('');
	let optionsRequest = 0;
	// svelte-ignore state_referenced_locally
	const editing = rows.length > 0;
	const paymentTypes = ['CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'BOOKING', 'UTANG', 'PACKING', ...(editing ? ['BATAL'] : [])];
	const total = $derived(Math.round(lines.reduce((sum, line) => sum + line.price * line.qty * (1 - line.discPct / 100), 0)));

	function setPaymentType(type: string) {
		paymentType = type;
		if (type === 'CASH') {
			debit = 0;
			credit = 0;
			bankId = '';
			bankInternal = '';
			noRef = '';
			dueDate = '';
		} else if (type === 'DEBIT') {
			credit = 0;
			bankId = '';
			bankInternal = '';
			noRef = '';
			dueDate = '';
		} else if (type === 'CREDIT') {
			debit = 0;
			bankId = '';
			bankInternal = '';
			noRef = '';
			dueDate = '';
		} else if (type === 'TRANSFER') {
			cash = 0;
			debit = 0;
			credit = 0;
			bankId = '';
			bankInternal = '';
			noRef = '';
			if (!dueDate) dueDate = today();
		} else if (type === 'UTANG' && !dueDate) {
			dueDate = today();
		} else if (type === 'BATAL') {
			bankId = '';
			bankInternal = '';
			norek = '';
			noRef = '';
			dueDate = '';
			cash = 0;
			debit = 0;
			credit = 0;
			transfer = 0;
		}
	}

	$effect(() => {
		if (!storeId) return;
		const requestId = ++optionsRequest;
		optionsLoading = true;
		const params = new URLSearchParams({ options: '1', store: storeId });
		api<{ customers: Customer[]; banks: Bank[] }>(`/api/toko/penjualan?${params}`)
			.then((result) => {
				if (requestId !== optionsRequest) return;
				customers = result.customers;
				banks = result.banks;
			})
			.catch((reason) => {
				if (requestId !== optionsRequest) return;
				error = reason instanceof ApiError ? reason.message : 'Gagal memuat pilihan customer dan bank';
			})
			.finally(() => {
				if (requestId === optionsRequest) optionsLoading = false;
			});
	});

	async function addProduct() {
		error = '';
		if (!storeId || !customerId || !newProductId.trim()) {
			error = 'Pilih toko dan customer, lalu masukkan ID artikel.';
			return;
		}
		if (lines.some((line) => line.productId === newProductId.trim())) {
			error = 'Artikel tersebut sudah ada di daftar.';
			return;
		}
		try {
			const params = new URLSearchParams({ store: storeId, customer: customerId, product: newProductId.trim() });
			const product = await api<{ productId: string; name: string; price: number; barcodePrice: number }>(`/api/toko/penjualan?${params}`);
			lines = [...lines, { productId: product.productId, name: product.name, qty: 1, price: product.price, barcodePrice: product.barcodePrice, discPct: 0 }];
			newProductId = '';
		} catch (reason) {
			error = reason instanceof ApiError ? reason.message : 'Gagal mencari artikel';
		}
	}

	async function save() {
		error = '';
		if (paymentType === 'BATAL' && !(await ask({ title: 'Batalkan transaksi?', message: 'Transaksi tidak akan memengaruhi stok setelah dibatalkan.', danger: true, confirmText: 'Batalkan' }))) return;
		if (!lines.length) {
			error = 'Tambahkan minimal satu artikel.';
			return;
		}
		loading = true;
		try {
			const body = {
				storeId,
				customerId,
				date,
				remark,
				lines: lines.map((line) => ({
					productId: line.productId,
					qty: Number(line.qty),
					price: Number(line.price),
					barcodePrice: Number(line.barcodePrice),
					discPct: Number(line.discPct)
				})),
				payment: {
					type: paymentType,
					bankId,
					bankInternal,
					norek,
					noRef,
					dueDate,
					status: paymentStatus,
					cash: Number(cash),
					debit: Number(debit),
					credit: Number(credit),
					transfer: Number(transfer)
				},
				...(editing ? { documentId: first!.documentId } : {})
			};
			const result = await api<{ no: string }>('/api/toko/penjualan', { method: editing ? 'PUT' : 'POST', body });
			toast.success(`Penjualan ${result.no} ${editing ? 'diperbarui' : 'disimpan'}`);
			onSaved();
		} catch (reason) {
			error = reason instanceof ApiError ? reason.message : 'Gagal menyimpan transaksi';
		} finally {
			loading = false;
		}
	}
</script>

<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="presentation">
	<dialog open class="card my-auto w-full max-w-5xl overflow-hidden shadow-xl" aria-modal="true" aria-labelledby="sale-form-title">
		<form onsubmit={(event) => { event.preventDefault(); save(); }}>
			<header class="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-700">
				<h2 id="sale-form-title" class="font-semibold">{editing ? 'Edit Penjualan' : 'Penjualan Baru'}</h2>
				<button type="button" class="btn btn-ghost size-8 p-0" onclick={onClose} aria-label="Tutup"><X class="size-4" /></button>
			</header>
			<div class="grid gap-4 p-4">
				{#if error}<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200" role="alert">{error}</p>{/if}
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<label class="grid gap-1 text-xs text-stone-500">Toko
						<select class="input" bind:value={storeId} disabled={loading || stores.length < 2}>
							{#each stores as store (store.value)}<option value={store.value}>{store.label}</option>{/each}
						</select>
					</label>
					<label class="grid gap-1 text-xs text-stone-500">Customer
						<select class="input" bind:value={customerId} required disabled={optionsLoading || loading}>
							<option value="">Pilih customer</option>
							{#each customers as customer (customer.value)}<option value={customer.value}>{customer.value} · {customer.label}</option>{/each}
						</select>
					</label>
					<label class="grid gap-1 text-xs text-stone-500">Tanggal
						<input class="input" type="date" bind:value={date} max={today()} required disabled={loading} />
					</label>
					<label class="grid gap-1 text-xs text-stone-500">Remark
						<input class="input" bind:value={remark} maxlength="50" disabled={loading} />
					</label>
				</div>

				<div class="rounded-xl border border-stone-200 dark:border-stone-700">
					<div class="flex flex-wrap items-end gap-2 border-b border-stone-200 p-3 dark:border-stone-700">
						<label class="grid min-w-48 flex-1 gap-1 text-xs text-stone-500">ID Artikel
							<input class="input" bind:value={newProductId} maxlength="20" onkeydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addProduct(); } }} disabled={!customerId || loading} />
						</label>
						<button type="button" class="btn btn-secondary" onclick={addProduct} disabled={!customerId || loading}><Plus class="size-4" /> Tambah Artikel</button>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full min-w-[760px] text-sm">
							<thead class="bg-stone-50 text-left text-xs text-stone-500 dark:bg-stone-800/50">
								<tr><th class="px-3 py-2">Artikel</th><th class="w-24 px-2 py-2">Qty</th><th class="w-36 px-2 py-2">Harga</th><th class="w-28 px-2 py-2">Diskon %</th><th class="w-36 px-2 py-2 text-right">Total</th><th class="w-10"></th></tr>
							</thead>
							<tbody>
								{#each lines as line, i (line.productId)}
									<tr class="border-t border-stone-100 dark:border-stone-800">
										<td class="px-3 py-2"><span class="font-mono text-xs">{line.productId}</span><span class="ml-2">{line.name}</span></td>
										<td class="px-2 py-2"><input class="input w-20" type="number" min="1" step="1" bind:value={line.qty} disabled={loading} /></td>
										<td class="px-2 py-2"><input class="input w-32" type="number" min="0" step="1" bind:value={line.price} disabled={loading} /></td>
										<td class="px-2 py-2"><input class="input w-24" type="number" min="0" max="100" step="0.01" bind:value={line.discPct} disabled={loading} /></td>
										<td class="px-3 py-2 text-right tabular-nums">{Math.round(line.price * line.qty * (1 - line.discPct / 100)).toLocaleString('id-ID')}</td>
										<td class="px-2 py-2"><button type="button" class="btn btn-ghost size-8 p-0 text-rose-600" onclick={() => (lines = lines.filter((_, index) => index !== i))} aria-label="Hapus artikel" disabled={loading}><Trash class="size-4" /></button></td>
									</tr>
								{:else}
									<tr><td colspan="6" class="px-3 py-6 text-center text-sm text-stone-500">Belum ada artikel.</td></tr>
								{/each}
							</tbody>
							<tfoot class="border-t border-stone-200 dark:border-stone-700"><tr><td colspan="4" class="px-3 py-2 text-right font-semibold">Total</td><td class="px-3 py-2 text-right font-semibold tabular-nums">{total.toLocaleString('id-ID')}</td><td></td></tr></tfoot>
						</table>
					</div>
				</div>

				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<label class="grid gap-1 text-xs text-stone-500">Tipe Pembayaran
						<select class="input" value={paymentType} onchange={(event) => setPaymentType(event.currentTarget.value)} disabled={loading}>
							{#each paymentTypes as type}<option value={type}>{type}</option>{/each}
						</select>
					</label>
					{#if ['DEBIT', 'CREDIT', 'TRANSFER'].includes(paymentType)}
						<label class="grid gap-1 text-xs text-stone-500">Bank
							<select class="input" bind:value={bankId} required disabled={loading}>
								<option value="">Pilih bank</option>
								{#each banks as bank (bank.value)}<option value={bank.value}>{bank.value} · {bank.label}</option>{/each}
							</select>
						</label>
					{/if}
					{#if ['TRANSFER', 'UTANG'].includes(paymentType)}
						<label class="grid gap-1 text-xs text-stone-500">Tanggal Tempo
							<input class="input" type="date" bind:value={dueDate} required disabled={loading} />
						</label>
					{/if}
					<label class="grid gap-1 text-xs text-stone-500">Bank Internal
						<input class="input" bind:value={bankInternal} maxlength="5" disabled={loading || paymentType === 'BATAL'} />
					</label>
					<label class="grid gap-1 text-xs text-stone-500">No. Rekening
						<input class="input" bind:value={norek} maxlength="30" disabled={loading || paymentType === 'BATAL'} />
					</label>
					<label class="grid gap-1 text-xs text-stone-500">No. Referensi
						<input class="input" bind:value={noRef} maxlength="30" disabled={loading || paymentType === 'BATAL'} />
					</label>
					<label class="grid gap-1 text-xs text-stone-500">Tunai
						<input class="input" type="number" min="0" step="1" bind:value={cash} disabled={loading || paymentType === 'BATAL'} />
					</label>
					<label class="grid gap-1 text-xs text-stone-500">Debit
						<input class="input" type="number" min="0" step="1" bind:value={debit} disabled={loading || paymentType === 'BATAL'} />
					</label>
					<label class="grid gap-1 text-xs text-stone-500">Kredit
						<input class="input" type="number" min="0" step="1" bind:value={credit} disabled={loading || paymentType === 'BATAL'} />
					</label>
					<label class="grid gap-1 text-xs text-stone-500">Transfer
						<input class="input" type="number" min="0" step="1" bind:value={transfer} disabled={loading || paymentType === 'BATAL'} />
					</label>
					<label class="grid gap-1 text-xs text-stone-500">Status Pembayaran
						<select class="input" bind:value={paymentStatus} disabled={loading || paymentType === 'BATAL'}><option value="C">Cash</option><option value="T">Transfer</option></select>
					</label>
				</div>
			</div>
			<footer class="flex justify-end gap-2 border-t border-stone-200 px-4 py-3 dark:border-stone-700">
				<button type="button" class="btn btn-secondary" onclick={onClose} disabled={loading}>Batal</button>
				<button type="submit" class="btn btn-primary" disabled={loading || optionsLoading}>{loading ? 'Menyimpan…' : 'Simpan'}</button>
			</footer>
		</form>
	</dialog>
</div>
