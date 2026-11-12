<script lang="ts">
	import { Lock, LockOpen, TriangleAlert } from '@lucide/svelte';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { db } from '#lib/dev-data/db.svelte.ts';
	import { iso, monthEnd, monthLabel, money, num, today } from '#lib/util/format.ts';
	import { lastClosing, locMatch, stockMutation, type Closing } from '#lib/domain/ledger.ts';
	import { TX, type Leaf } from '#lib/domain/menu.ts';
	import type { Doc } from '#lib/domain/types.ts';
	import { ask, toast } from '#lib/state/ui.svelte.ts';
	import PageHeader from '#lib/components/data/PageHeader.svelte';

	let { leaf, scope }: { leaf: Leaf; scope: 'MAT' | 'INV' | 'TOKO' } = $props();

	const scopeName = $derived({ MAT: 'Gudang Material', INV: 'Gudang Inventory', TOKO: 'Seluruh Toko' }[scope]);
	const itemTable = $derived(scope === 'MAT' ? 'raw_materials' : 'products');
	const priceKey = $derived(scope === 'MAT' ? 'price' : 'buyPrice');
	const canPost = $derived(auth.can(leaf.path, 'post'));

	const last = $derived(lastClosing(scope));
	const history = $derived(db.all<Closing>('closings').filter((c) => c.scope === scope).sort((a, b) => b.period.localeCompare(a.period)));
	const nextPeriod = $derived.by(() => {
		if (!last) {
			const d = new Date();
			d.setDate(1);
			d.setMonth(d.getMonth() - 1);
			return iso(d).slice(0, 7);
		}
		const [y, m] = last.period.split('-').map(Number);
		return iso(new Date(y, m, 1)).slice(0, 7);
	});
	const nextEnd = $derived(monthEnd(nextPeriod));
	const canClose = $derived(nextEnd < today());

	// dokumen draft di periode yang akan ditutup
	const drafts = $derived(
		TX.filter((t) => t.path && t.def.closingScope === scope).flatMap((t) =>
			db
				.all<Doc>(t.def.table)
				.filter((d) => d.status === 'draft' && d.date >= nextPeriod + '-01' && d.date <= nextEnd)
				.map((d) => ({ ...d, path: t.path, label: t.label }))
		)
	);
	const snapshot = $derived(stockMutation(itemTable, locMatch(scope), nextPeriod + '-01', nextEnd));
	const snapTotal = $derived(snapshot.reduce((a, r) => ({ qty: a.qty + r.close, value: a.value + r.close * (r.item[priceKey] ?? 0) }), { qty: 0, value: 0 }));

	async function close() {
		if (drafts.length) return toast.error(`Masih ada ${drafts.length} dokumen draft di periode ini`);
		if (!(await ask({ title: `Closing ${monthLabel(nextPeriod)}?`, message: `Semua transaksi ${scopeName} s/d ${monthEnd(nextPeriod)} akan dikunci.`, confirmText: 'Closing' }))) return;
		await db.insert('closings', { scope, period: nextPeriod, closedAt: new Date().toISOString(), closedBy: auth.user!.username });
		toast.success(`Periode ${monthLabel(nextPeriod)} berhasil di-closing`);
	}
	async function reopen() {
		if (!last) return;
		if (!(await ask({ title: `Buka kembali ${monthLabel(last.period)}?`, message: 'Transaksi pada periode ini dapat diubah lagi.', danger: true, confirmText: 'Buka Closing' }))) return;
		await db.remove('closings', last.id);
		toast.success('Closing dibuka kembali');
	}
</script>

<PageHeader title={leaf.label} subtitle="{scopeName} · {leaf.trail.slice(0, -1).join(' › ')}" icon={leaf.icon} />

<div class="grid gap-4 lg:grid-cols-[1fr_380px]">
	<div class="space-y-4">
		<div class="card p-5">
			<div class="flex flex-wrap items-center gap-4">
				<div class="grid size-12 place-items-center rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900"><Lock class="size-5" /></div>
				<div class="flex-1">
					<p class="text-sm text-stone-500">Periode terkunci s/d</p>
					<p class="text-xl font-semibold">{last ? monthLabel(last.period) : 'Belum pernah closing'}</p>
				</div>
				{#if last && auth.admin}
					<button class="btn btn-secondary" onclick={reopen}><LockOpen class="size-4" /> Buka Closing</button>
				{/if}
			</div>
		</div>

		<div class="card p-5">
			<h2 class="font-medium">Closing periode berikutnya: {monthLabel(nextPeriod)}</h2>
			<p class="mt-1 text-sm text-stone-500">Saldo akhir stok akan menjadi saldo awal periode berikutnya dan transaksi pada periode ini tidak dapat diubah.</p>

			<div class="mt-4 grid grid-cols-2 gap-3">
				<div class="rounded-xl bg-stone-50 p-3 dark:bg-stone-800/50"><p class="text-xs text-stone-500">Total Qty Akhir</p><p class="font-semibold tabular-nums">{num(snapTotal.qty)}</p></div>
				<div class="rounded-xl bg-stone-50 p-3 dark:bg-stone-800/50"><p class="text-xs text-stone-500">Nilai Persediaan</p><p class="font-semibold tabular-nums">Rp {money(snapTotal.value)}</p></div>
			</div>

			{#if drafts.length}
				<div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-500/20 dark:bg-amber-500/10">
					<p class="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300"><TriangleAlert class="size-4" /> {drafts.length} dokumen draft harus diposting/dihapus dulu</p>
					<ul class="mt-2 space-y-1">
						{#each drafts.slice(0, 8) as d (d.id)}
							<li><a class="font-mono text-xs text-brand-600 hover:underline" href="{d.path}?id={d.id}">{d.no}</a> <span class="text-xs text-stone-500">· {d.label}</span></li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="mt-5 flex justify-end">
				{#if !canPost}
					<p class="text-sm text-stone-400">Anda tidak memiliki hak untuk melakukan closing.</p>
				{:else if !canClose}
					<p class="text-sm text-stone-400">Periode {monthLabel(nextPeriod)} belum berakhir.</p>
				{:else}
					<button class="btn btn-primary" onclick={close} disabled={!!drafts.length}><Lock class="size-4" /> Closing {monthLabel(nextPeriod)}</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="card p-5">
		<h2 class="mb-3 font-medium">Riwayat Closing</h2>
		<ol class="relative space-y-4 border-l border-stone-200 pl-5 dark:border-stone-800">
			{#each history as h (h.id)}
				<li>
					<span class="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-white bg-brand-500 dark:border-stone-900"></span>
					<p class="text-sm font-medium">{monthLabel(h.period)}</p>
					<p class="text-xs text-stone-500">oleh {h.closedBy} · {new Date(h.closedAt).toLocaleString('id-ID')}</p>
				</li>
			{:else}
				<li class="text-sm text-stone-400">Belum ada riwayat</li>
			{/each}
		</ol>
	</div>
</div>
