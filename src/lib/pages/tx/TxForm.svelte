<script lang="ts">
	import DateInput from '#lib/components/DateInput.svelte';
	import { tooltip } from '#lib/ui/tooltip.ts';
	import Select from '#lib/components/Select.svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Ban, Check, Lock, Printer, Save, Trash } from '@lucide/svelte';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { date as fdate, money, num, today, uid } from '#lib/erp/format.ts';
	import { computeTotals, lockedUntil, openItems, stockAvailable, unitCost } from '#lib/erp/ledger.ts';
	import { txByTable, type Leaf } from '#lib/erp/menu.ts';
	import type { Doc, DocStatus, Line, TxDef } from '#lib/erp/types.ts';
	import { ask, toast } from '#lib/erp/ui.svelte.ts';
	import Field from '#lib/components/Field.svelte';
	import NumberInput from '#lib/components/NumberInput.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import LinesEditor from './LinesEditor.svelte';
	import { formNav } from '#lib/ui/formNav.ts';

	let { leaf, docId }: { leaf: Leaf; docId: string } = $props();

	// svelte-ignore state_referenced_locally
	const def = leaf.page as TxDef;
	// svelte-ignore state_referenced_locally
	const existing = docId === 'new' ? undefined : db.get<Doc>(def.table, docId);
	const isNew = !existing;
	/** id di URL tidak ada (dokumen sudah dihapus / tautan salah) */
	// svelte-ignore state_referenced_locally
	const missing = docId !== 'new' && !existing;

	function blank(): Doc {
		const ctx = { userStoreId: auth.user?.storeId ?? undefined, today: today() };
		const d: Doc = { id: '', no: '', date: today(), status: 'draft', lines: def.lines ? [{ _k: uid() }] : [], notes: '' };
		for (const f of def.header) d[f.key] = typeof f.default === 'function' ? f.default(ctx) : (f.default ?? '');
		if (def.totals?.discount) d.discount = 0;
		if (def.totals?.tax) d.taxRate = 11;
		return d;
	}
	let doc = $state<Doc>(existing ? ($state.snapshot(existing) as Doc) : blank());
	let saveBtn = $state<HTMLButtonElement>();

	const can = $derived({
		create: auth.can(leaf.path, 'create'),
		edit: auth.can(leaf.path, 'edit'),
		delete: auth.can(leaf.path, 'delete'),
		post: auth.can(leaf.path, 'post')
	});
	const lockDate = $derived(lockedUntil(def.closingScope));
	const periodLocked = $derived(!!lockDate && doc.date <= lockDate);
	const editable = $derived(doc.status === 'draft' && !periodLocked && (isNew ? can.create : can.edit));
	const totals = $derived(computeTotals(def, doc));
	const balance = $derived(def.balanced ? doc.lines.reduce((s, l) => s + (+l.debit || 0) - (+l.credit || 0), 0) : 0);
	const sourceDocs = $derived(def.source ? db.all<Doc>(def.source.table).filter((s) => !def.source!.filter || def.source!.filter(s, doc) || s.id === doc.sourceId) : []);
	const sourceMeta = $derived(def.source ? txByTable(def.source.table) : undefined);
	const partyOf = (d: Doc) => {
		const p = txByTable(def.source?.table ?? '')?.def.party;
		return p ? db.name(p.ref, d[p.field]) : '';
	};

	function applySource(id: string) {
		const src = db.get<Doc>(def.source!.table, id);
		doc.sourceId = id;
		if (!src) return;
		Object.assign(doc, def.source!.header?.(src) ?? {});
		doc.lines = src.lines.map((l) => ({ _k: uid(), ...(def.source!.line ? def.source!.line(l) : l) }));
		toast.info(`${src.lines.length} baris disalin dari ${src.no}`);
	}

	/** baris tanpa isian sama sekali — diabaikan saat validasi & dibuang saat simpan */
	const blankLine = (l: Line) => !Object.keys(l).some((k) => k !== '_k' && l[k] !== '' && l[k] != null);

	function validate(forPost: boolean): string | null {
		for (const f of def.header) {
			if (f.showIf && !f.showIf(doc)) continue;
			if (f.required && (doc[f.key] === '' || doc[f.key] == null)) return `${f.label} wajib diisi`;
		}
		if (!doc.date) return 'Tanggal wajib diisi';
		const custom = def.validate?.(doc);
		if (custom) return custom;
		for (const [i, l] of doc.lines.entries()) {
			if (blankLine(l)) continue;
			for (const f of def.lines?.fields ?? []) {
				if ((f.type === 'number' || f.type === 'money') && !f.readonly && +l[f.key] < 0) return `Baris ${i + 1}: ${f.label} tidak boleh negatif`;
				if (f.key === 'disc' && +l[f.key] > 100) return `Baris ${i + 1}: diskon maksimal 100%`;
			}
		}
		if (+doc.discount < 0) return 'Diskon tidak boleh negatif';
		if (def.totals?.discount && +doc.discount > totals.subtotal) return 'Diskon melebihi subtotal';
		if (lockDate && doc.date <= lockDate) return `Periode s/d ${fdate(lockDate)} sudah di-closing`;
		if (!forPost) return null;
		if (def.lines) {
			const lines = doc.lines.filter((l) => def.lines!.fields.some((f) => f.required && l[f.key]));
			if (!lines.length) return 'Minimal satu baris detail';
			for (const [i, l] of doc.lines.entries()) {
				if (blankLine(l)) continue;
				for (const f of def.lines.fields)
					if (f.required && (l[f.key] === '' || l[f.key] == null)) return `Baris ${i + 1}: ${f.label} wajib diisi`;
			}
			if (doc.lines.some((l) => !blankLine(l) && 'qty' in l && !(+l.qty > 0))) return 'Qty harus lebih dari 0';
		}
		if (def.balanced) {
			if (Math.abs(balance) > 0.5) return `Jurnal tidak seimbang (selisih ${money(balance)})`;
			if (!(totals.subtotal > 0)) return 'Nilai jurnal masih 0';
		}
		if (def.source?.strictQty && doc.sourceId) {
			const src = db.get<Doc>(def.source.table, doc.sourceId);
			const max = new Map<string, number>();
			for (const l of src?.lines ?? []) max.set(l.itemId, (max.get(l.itemId) ?? 0) + (+l.qty || 0));
			const got = new Map<string, number>();
			for (const l of doc.lines) if (l.itemId) got.set(l.itemId, (got.get(l.itemId) ?? 0) + (+l.qty || 0));
			const name = (id: string) => db.name(def.lines?.itemTable ?? 'products', id);
			for (const [id, q] of got) {
				if (!max.has(id)) return `${name(id)} tidak ada di ${src?.no ?? def.source.label}`;
				if (q > max.get(id)!) return `Qty ${name(id)} (${num(q)}) melebihi ${src?.no} (${num(max.get(id))})`;
			}
		}
		if (def.stock) {
			const s = def.stock;
			const loc = s.loc(doc);
			const need = new Map<string, number>();
			for (const l of doc.lines) {
				const q = s.qty(l);
				if (q < 0 && l.itemId) need.set(l.itemId, (need.get(l.itemId) ?? 0) - q);
			}
			for (const [id, q] of need) {
				const bal = stockAvailable(s.itemTable, loc, id, doc.date, doc.id);
				if (bal < q) return `Stok ${db.name(s.itemTable, id)} tidak cukup per ${fdate(doc.date)} (tersedia ${num(bal)}, butuh ${num(q)})`;
			}
		}
		return null;
	}

	async function persist(status: DocStatus) {
		const now = new Date().toISOString();
		const rec = { ...($state.snapshot(doc) as Doc), ...totals, status, updatedAt: now };
		rec.lines = rec.lines.filter((l) => !blankLine(l));
		// harga pokok dikunci saat posting agar jurnal HPP tidak berubah bila harga master diganti
		if (status === 'posted' && def.stock) for (const l of rec.lines) if (l.itemId) l.cost = unitCost(def.stock.itemTable, l);
		if (isNew) {
			rec.id = uid();
			rec.no = db.nextNo(def.table, def.prefix, rec.date);
			rec.createdBy = auth.user!.username;
			rec.createdAt = now;
			await db.insert(def.table, rec);
			await goto(`${leaf.path}?id=${rec.id}`, { replace: true });
		} else {
			await db.update(def.table, rec.id, rec);
			doc = rec;
		}
		return rec;
	}

	async function saveDraft() {
		const err = validate(false);
		if (err) return toast.error(err);
		const r = await persist('draft');
		toast.success(`Draft ${r.no} tersimpan`);
	}
	async function post() {
		def.beforePost?.(doc);
		const err = validate(true);
		if (err) return toast.error(err);
		const label = def.postLabel ?? 'Posting';
		if (!(await ask({ title: `${label} dokumen?`, message: 'Dokumen yang sudah diposting tidak dapat diubah lagi.', confirmText: label }))) return;
		const r = await persist('posted');
		toast.success(`${r.no} berhasil di-${label.toLowerCase()}`);
	}
	/** stok masuk / tagihan dari dokumen ini yang sudah terpakai → pembatalan akan membuat saldo minus */
	function voidShortage(): string | null {
		for (const e of def.ledger ?? []) {
			if (e.sign < 0 || (e.when && !e.when(doc))) continue;
			const left = openItems(e.kind).find((i) => i.docId === doc.id)?.left ?? 0;
			const paid = (doc.total ?? 0) - left;
			if (paid >= 1) return `${e.kind === 'ar' ? 'tagihan' : 'hutang'} ini sudah dibayar/dikurangi ${money(paid)}`;
		}
		const s = def.stock;
		if (!s) return null;
		const loc = s.loc(doc);
		const items = new Set(doc.lines.filter((l) => l.itemId && s.qty(l) > 0).map((l) => l.itemId as string));
		for (const id of items) {
			const bal = stockAvailable(s.itemTable, loc, id, doc.date, doc.id);
			if (bal < 0) return `stok ${db.name(s.itemTable, id)} sudah terpakai (saldo akan menjadi ${num(bal)})`;
		}
		return null;
	}
	async function voidDoc() {
		const users = Object.entries(db.t).flatMap(([, rows]) => rows.filter((r) => r.sourceId === doc.id && r.status !== 'void'));
		if (users.length) return toast.error(`Tidak bisa dibatalkan: sudah dipakai di ${users.map((u) => u.no).join(', ')}`);
		if (periodLocked) return toast.error('Periode sudah di-closing');
		const short = voidShortage();
		if (short) return toast.error(`Tidak bisa dibatalkan: ${short}`);
		const lbl = def.statusLabels?.void ?? 'Batalkan';
		if (!(await ask({ title: `${lbl} dokumen ${doc.no}?`, message: 'Efek stok/saldo dari dokumen ini akan dibatalkan.', danger: true, confirmText: lbl }))) return;
		await persist('void');
		toast.success(`${doc.no} dibatalkan`);
	}
	async function remove() {
		if (!(await ask({ title: `Hapus draft ${doc.no}?`, danger: true, confirmText: 'Hapus' }))) return;
		await db.remove(def.table, doc.id);
		toast.success('Draft dihapus');
		goto(leaf.path);
	}

	const headerShown = $derived(def.header.filter((f) => !f.showIf || f.showIf(doc)));
	const labelOfField = (key: string) => {
		const f = def.header.find((x) => x.key === key)!;
		const v = doc[key];
		return f.type === 'lookup' ? db.label(f.ref!, v) : f.type === 'date' ? fdate(v) : f.type === 'money' ? money(v) : v;
	};
</script>

{#if missing}
	<div class="grid place-items-center py-24 text-center">
		<p class="text-6xl font-bold text-stone-200 dark:text-stone-800">404</p>
		<p class="mt-2 font-medium">Dokumen tidak ditemukan</p>
		<p class="mt-1 text-sm text-stone-500">Dokumen mungkin sudah dihapus atau tautannya salah.</p>
		<a href={leaf.path} class="btn btn-secondary mt-6"><ArrowLeft class="size-4" /> Daftar {leaf.label}</a>
	</div>
{:else}
<div class="print:hidden" {@attach formNav({ onsave: () => editable && saveDraft(), last: () => saveBtn })}>
	<!-- judul -->
	<div class="mb-4 flex flex-wrap items-center gap-3">
		<a href={leaf.path} class="btn btn-secondary btn-icon" aria-label="Kembali" {@attach tooltip()}><ArrowLeft class="size-4" /></a>
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="truncate text-xl font-medium">{isNew ? `${leaf.label} Baru` : doc.no}</h1>
				{#if !isNew}<StatusBadge status={doc.status} labels={def.statusLabels} />{/if}
			</div>
			<p class="truncate text-sm text-stone-500">{isNew ? 'Nomor dibuat otomatis saat disimpan' : `${leaf.label} · dibuat oleh ${doc.createdBy}`}</p>
		</div>
		{#if !isNew}
			<button class="btn btn-secondary hidden sm:inline-flex" onclick={() => print()}><Printer class="size-4" /> Cetak</button>
		{/if}
	</div>

	{#if periodLocked}
		<div class="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
			<Lock class="size-4 shrink-0" /> Periode s/d {fdate(lockDate)} sudah di-closing. Dokumen hanya dapat dilihat.
		</div>
	{/if}

	<div class="grid gap-4 xl:grid-cols-[1fr_340px]">
		<div class="min-w-0 space-y-4">
			<!-- header -->
			<section class="card p-4 sm:p-5">
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div>
						<label class="label" for="f-date">Tanggal <span class="text-rose-500">*</span></label>
						<DateInput id="f-date" bind:value={doc.date} disabled={!editable} />
					</div>
					{#if def.source}
						<div>
							<label class="label" for="f-src">Ambil dari {def.source.label}</label>
							<Select
								id="f-src"
								value={doc.sourceId || null}
								options={sourceDocs.map((s) => ({ value: s.id, label: s.no, hint: `${partyOf(s)} · ${fdate(s.date)}`, keywords: partyOf(s) }))}
								placeholder="— Tanpa referensi —"
								label="Ambil dari {def.source.label}"
								clearable
								searchable
								emptyText="Tidak ada dokumen yang bisa diambil"
								disabled={!editable}
								onchange={(v) => applySource(v ? String(v) : '')}
							/>
							{#if doc.sourceId && sourceMeta}
								<a class="mt-1 inline-block text-xs text-brand-600 hover:underline" href="{sourceMeta.path}?id={doc.sourceId}">Lihat dokumen sumber →</a>
							{/if}
						</div>
					{/if}
					{#each headerShown as f (f.key)}
						<div class={f.span === 2 || f.type === 'textarea' ? 'sm:col-span-2 lg:col-span-3' : ''}>
							<Field field={{ ...f, span: 1 }} bind:form={doc} disabled={!editable} />
						</div>
					{/each}
				</div>
			</section>

			<!-- detail -->
			{#if def.lines}
				<section class="card p-4 sm:p-5">
					<div class="mb-3 flex items-center justify-between">
						<h2 class="font-medium">{def.lines.label ?? 'Detail Barang'}</h2>
						<span class="text-xs text-stone-400">{doc.lines.length} baris</span>
					</div>
					<LinesEditor def={def.lines} bind:doc disabled={!editable} />
				</section>
			{/if}
		</div>

		<!-- ringkasan -->
		<aside class="space-y-4">
			{#if !def.noAmount}
				<section class="card p-4 sm:p-5">
					<h2 class="mb-3 font-medium">Ringkasan</h2>
					<dl class="space-y-2.5 text-sm">
						{#if def.balanced}
							{@const debit = doc.lines.reduce((s, l) => s + (+l.debit || 0), 0)}
							{@const credit = doc.lines.reduce((s, l) => s + (+l.credit || 0), 0)}
							<div class="flex justify-between"><dt class="text-stone-500">Total Debit</dt><dd class="tabular-nums">{money(debit)}</dd></div>
							<div class="flex justify-between"><dt class="text-stone-500">Total Kredit</dt><dd class="tabular-nums">{money(credit)}</dd></div>
							<div class="flex items-center justify-between border-t border-stone-100 pt-2.5 dark:border-stone-800">
								<dt class="font-medium">Selisih</dt>
								<dd class="badge {Math.abs(balance) < 0.5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'}">
									{Math.abs(balance) < 0.5 ? 'Seimbang' : money(balance)}
								</dd>
							</div>
						{:else}
							<div class="flex justify-between"><dt class="text-stone-500">Subtotal</dt><dd class="tabular-nums">{money(totals.subtotal)}</dd></div>
							{#if def.totals?.discount}
								<div class="flex items-center justify-between gap-3">
									<dt class="text-stone-500">Diskon</dt>
									<dd class="w-36">{#if editable}<NumberInput bind:value={doc.discount} money compact />{:else}<span class="block text-right tabular-nums">{money(doc.discount)}</span>{/if}</dd>
								</div>
							{/if}
							{#if def.totals?.tax}
								<div class="flex items-center justify-between gap-3">
									<dt class="text-stone-500">PPN</dt>
									<dd class="flex items-center gap-2">
										{#if editable}
											<div class="w-24"><Select bind:value={doc.taxRate} options={[0, 11, 12].map((r) => ({ value: r, label: r + '%' }))} compact label="Tarif PPN" /></div>
										{:else}<span class="text-xs text-stone-400">{doc.taxRate}%</span>{/if}
										<span class="w-24 text-right tabular-nums">{money(totals.tax)}</span>
									</dd>
								</div>
							{/if}
							<div class="flex items-baseline justify-between border-t border-stone-100 pt-3 dark:border-stone-800">
								<dt class="font-medium">Total</dt>
								<dd class="text-xl font-semibold tracking-tight tabular-nums">Rp {money(totals.total)}</dd>
							</div>
						{/if}
					</dl>
				</section>
			{/if}
			<section class="card p-4 sm:p-5">
				<label class="label" for="f-notes">Catatan</label>
				<textarea id="f-notes" class="input" rows="3" bind:value={doc.notes} disabled={!editable} placeholder="Opsional"></textarea>
				{#if !isNew}
					<p class="mt-3 text-xs text-stone-400">Terakhir diubah {new Date(doc.updatedAt ?? '').toLocaleString('id-ID')}</p>
				{/if}
			</section>
		</aside>
	</div>

	<!-- action bar -->
	<div class="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mt-4 lg:bottom-4">
		<div class="card flex items-center gap-2 p-2 shadow-lg">
			{#if !isNew && doc.status === 'draft' && can.delete && !periodLocked}
				<button class="btn btn-ghost text-rose-600" onclick={remove}><Trash class="size-4" /><span class="hidden sm:inline">Hapus</span></button>
			{/if}
			{#if doc.status === 'posted' && can.post && !periodLocked}
				<button class="btn btn-ghost text-rose-600" onclick={voidDoc}><Ban class="size-4" /><span class="hidden sm:inline">{def.statusLabels?.void ?? 'Batalkan'}</span></button>
			{/if}
			{#if !isNew}<button class="btn btn-ghost btn-icon sm:hidden" onclick={() => print()} aria-label="Cetak" {@attach tooltip()}><Printer class="size-4" /></button>{/if}
			<div class="flex-1"></div>
			{#if editable}
				<button bind:this={saveBtn} class="btn btn-secondary" onclick={saveDraft} {@attach tooltip('Simpan draft', { kbd: 'Ctrl S' })}><Save class="size-4" /> <span>Simpan<span class="hidden sm:inline">{' Draft'}</span></span></button>
				{#if can.post}
					<button class="btn btn-primary" onclick={post}><Check class="size-4" /> {def.postLabel ?? 'Posting'}</button>
				{/if}
			{:else}
				<a href={leaf.path} class="btn btn-secondary">Tutup</a>
			{/if}
		</div>
	</div>
</div>

<!-- tampilan cetak -->
<div class="hidden text-[12px] text-black print:block">
	<div class="flex items-start justify-between border-b-2 border-black pb-3">
		<div>
			<p class="text-lg font-bold">ruangSenja</p>
			<p>Jl. Ir. H. Juanda No. 88, Bandung</p>
		</div>
		<div class="text-right">
			<p class="text-lg font-bold uppercase">{leaf.label}</p>
			<p>No: {doc.no}</p>
			<p>Tanggal: {fdate(doc.date)}</p>
		</div>
	</div>
	<table class="mt-3 w-full">
		<tbody>
			{#each headerShown as f (f.key)}
				{#if doc[f.key]}<tr><td class="w-40 py-0.5">{f.label}</td><td>: {labelOfField(f.key)}</td></tr>{/if}
			{/each}
		</tbody>
	</table>
	{#if def.lines}
		<table class="mt-3 w-full border-collapse">
			<thead>
				<tr>
					<th class="border border-black px-2 py-1 text-left">#</th>
					{#each def.lines.fields as f (f.key)}<th class="border border-black px-2 py-1 text-left">{f.label}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each doc.lines as l, i (l._k)}
					<tr>
						<td class="border border-black px-2 py-1">{i + 1}</td>
						{#each def.lines.fields as f (f.key)}
							<td class="border border-black px-2 py-1 {['number', 'money', 'computed'].includes(f.type) ? 'text-right' : ''}">
								{#if f.type === 'item'}{db.label(def.lines.itemTable!, l[f.key])}
								{:else if f.type === 'lookup'}{db.label(f.ref!, l[f.key])}
								{:else if f.type === 'computed'}{f.format === 'money' ? money(f.compute!(l, doc)) : num(f.compute!(l, doc))}
								{:else if f.type === 'money'}{money(l[f.key])}
								{:else if f.type === 'number'}{num(l[f.key])}
								{:else}{l[f.key] ?? ''}{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	{#if !def.noAmount && !def.balanced}
		<div class="mt-3 ml-auto w-64 space-y-0.5">
			<p class="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></p>
			{#if totals.discount}<p class="flex justify-between"><span>Diskon</span><span>{money(totals.discount)}</span></p>{/if}
			{#if totals.tax}<p class="flex justify-between"><span>PPN {doc.taxRate}%</span><span>{money(totals.tax)}</span></p>{/if}
			<p class="flex justify-between border-t border-black font-bold"><span>Total</span><span>Rp {money(totals.total)}</span></p>
		</div>
	{/if}
	{#if doc.notes}<p class="mt-3">Catatan: {doc.notes}</p>{/if}
	<div class="mt-12 grid grid-cols-3 text-center">
		<div>Dibuat,<br /><br /><br /><br />( {doc.createdBy} )</div>
		<div>Diperiksa,<br /><br /><br /><br />( ................ )</div>
		<div>Disetujui,<br /><br /><br /><br />( ................ )</div>
	</div>
</div>
{/if}
