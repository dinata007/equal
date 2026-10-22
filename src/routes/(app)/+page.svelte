<script lang="ts">
	import { ArrowRight, Clock, Package, Receipt, TrendingDown, TrendingUp, Wallet } from '@lucide/svelte';
	import { daily, groupSum, saleLines } from '#lib/erp/analytics.ts';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { addDays, date as fdate, money, num, today } from '#lib/erp/format.ts';
	import { cashMoves, locMatch, partyMoves, stockOnHand } from '#lib/erp/ledger.ts';
	import { LEAVES, MENU, TX, visibleTree } from '#lib/erp/menu.ts';
	import type { Doc } from '#lib/erp/types.ts';
	import BarChart from '#lib/components/BarChart.svelte';
	import BarList from '#lib/components/BarList.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';

	const T = today();
	const from = addDays(T, -29);
	const hour = new Date().getHours();
	const greet = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';

	const showSales = $derived(auth.canAny('/sales') || auth.canAny('/toko'));
	const showFin = $derived(auth.canAny('/akunting'));
	const showInv = $derived(auth.canAny('/inventory'));

	const lines = $derived(saleLines(from, T));
	const prev = $derived(saleLines(addDays(from, -30), addDays(from, -1)));
	const omzet = $derived(lines.reduce((s, l) => s + l.amount, 0));
	const prevOmzet = $derived(prev.reduce((s, l) => s + l.amount, 0));
	const growth = $derived(prevOmzet ? ((omzet - prevOmzet) / prevOmzet) * 100 : 0);
	const todaySales = $derived(lines.filter((l) => l.date === T).reduce((s, l) => s + l.amount, 0));
	const trxToday = $derived(new Set(lines.filter((l) => l.date === T).map((l) => l.docId)).size);
	const byDay = $derived(daily(lines, from, T));
	const byStore = $derived(groupSum(lines, (l) => l.channel, (l) => l.amount).map((g) => ({ label: g.key, value: g.value })));

	const bal = (kind: 'ar' | 'ap') => partyMoves(kind).reduce((s, m) => s + m.inc - m.dec, 0);
	const ar = $derived(showFin ? bal('ar') : 0);
	const ap = $derived(showFin ? bal('ap') : 0);
	const cash = $derived(
		showFin ? db.all('cashbanks').reduce((s, k) => s + (+k.opening || 0), 0) + cashMoves().reduce((s, m) => s + m.in - m.out, 0) : 0
	);

	const lowStock = $derived.by(() => {
		if (!showInv) return [];
		const oh = stockOnHand('products', locMatch('INV'));
		return db
			.all('products')
			.map((p) => ({ p, qty: oh.get(p.id) ?? 0 }))
			.filter((x) => x.qty <= (x.p.minStock ?? 0) * 3)
			.sort((a, b) => a.qty - b.qty)
			.slice(0, 6);
	});
	const stockValue = $derived.by(() => {
		if (!showInv) return 0;
		const oh = stockOnHand('products', (l) => l === 'INV' || l.startsWith('TOKO:'));
		return db.all('products').reduce((s, p) => s + (oh.get(p.id) ?? 0) * (p.buyPrice ?? 0), 0);
	});

	const pending = $derived(
		TX.filter((t) => auth.can(t.path, 'post'))
			.flatMap((t) => db.all<Doc>(t.def.table).filter((d) => d.status === 'draft').map((d) => ({ d, t })))
			.sort((a, b) => b.d.date.localeCompare(a.d.date))
	);
	const recent = $derived(
		TX.filter((t) => auth.can(t.path))
			.flatMap((t) => db.all<Doc>(t.def.table).map((d) => ({ d, t })))
			.sort((a, b) => (b.d.updatedAt ?? '').localeCompare(a.d.updatedAt ?? '') || b.d.date.localeCompare(a.d.date) || b.d.no.localeCompare(a.d.no))
			.slice(0, 7)
	);

	// pintasan: transaksi yang boleh dibuat user
	const shortcuts = $derived(LEAVES.filter((l) => l.page.kind === 'transaction' && auth.can(l.path, 'create')).slice(0, 8));
	const modules = $derived(visibleTree(MENU, (p) => auth.can(p)));
</script>

<svelte:head><title>Dashboard · ruangSenja</title></svelte:head>

<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
	<div>
		<p class="text-sm text-stone-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
		<h1 class="text-2xl font-medium">{greet}, {auth.user?.name.split(' ')[0]} 👋</h1>
	</div>
</div>

<!-- pintasan -->
{#if shortcuts.length}
	<div class="-mx-3 -mt-1 mb-4 flex gap-2 overflow-x-auto px-3 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
		{#each shortcuts as s (s.path)}
			<a href="{s.path}?id=new" class="card flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium transition hover:border-brand-300 hover:text-brand-700">
				{#if s.icon}<s.icon class="size-4 text-brand-600" />{/if}
				{s.label}
				<span class="text-xs font-normal text-stone-400">{s.module.label}</span>
			</a>
		{/each}
	</div>
{/if}

<!-- KPI -->
<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
	{#if showSales}
		<div class="card relative col-span-2 overflow-hidden bg-stone-900 dark:bg-brand-900 p-5 text-white">
			<img src="/icon.svg" alt="" aria-hidden="true" class="pointer-events-none absolute -right-8 -bottom-10 size-36 opacity-20" />
			<p class="text-sm text-white/80">Omzet 30 hari</p>
			<p class="mt-1 text-2xl font-semibold tracking-tight tabular-nums">Rp {money(omzet)}</p>
			<p class="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs">
				{#if growth >= 0}<TrendingUp class="size-3" />{:else}<TrendingDown class="size-3" />{/if}
				{num(Math.abs(growth))}% vs 30 hari sebelumnya
			</p>
		</div>
		<div class="card p-4">
			<div class="flex items-center justify-between"><p class="text-xs text-stone-500">Penjualan hari ini</p><Receipt class="size-4 text-stone-300" /></div>
			<p class="mt-1 text-base font-semibold tabular-nums sm:text-xl">Rp {money(todaySales)}</p>
			<p class="text-xs text-stone-400">{trxToday} transaksi</p>
		</div>
	{/if}
	{#if showFin}
		<div class="card p-4">
			<div class="flex items-center justify-between"><p class="text-xs text-stone-500">Piutang / Hutang</p><Wallet class="size-4 text-stone-300" /></div>
			<p class="mt-1 text-base font-semibold tabular-nums sm:text-xl">Rp {money(ar)}</p>
			<p class="text-xs text-stone-400">Hutang Rp {money(ap)}</p>
		</div>
		<div class="card p-4">
			<p class="text-xs text-stone-500">Saldo Kas & Bank</p>
			<p class="mt-1 text-base font-semibold tabular-nums sm:text-xl">Rp {money(cash)}</p>
			<p class="text-xs text-stone-400">{db.all('cashbanks').length} akun</p>
		</div>
	{/if}
	{#if showInv}
		<div class="card p-4">
			<div class="flex items-center justify-between"><p class="text-xs text-stone-500">Nilai Persediaan</p><Package class="size-4 text-stone-300" /></div>
			<p class="mt-1 text-base font-semibold tabular-nums sm:text-xl">Rp {money(stockValue)}</p>
			<p class="text-xs text-stone-400">Gudang + toko (harga beli)</p>
		</div>
	{/if}
</div>

<div class="grid gap-4 xl:grid-cols-3">
	<div class="min-w-0 space-y-4 xl:col-span-2">
		{#if showSales}
			<div class="card p-4 sm:p-5">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="font-medium">Omzet Harian · 30 hari</h2>
					{#if auth.can('/sales/report/analisa-penjualan')}<a href="/sales/report/analisa-penjualan" class="text-sm text-brand-600 hover:underline">Analisa →</a>{/if}
				</div>
				<BarChart data={byDay} />
			</div>
		{/if}

		<div class="card overflow-hidden">
			<div class="flex items-center justify-between px-4 pt-4 pb-2 sm:px-5"><h2 class="font-medium">Aktivitas Terbaru</h2></div>
			<ul class="divide-y divide-stone-100 dark:divide-stone-800">
				{#each recent as { d, t } (t.def.table + d.id)}
					<li>
						<a href="{t.path}?id={d.id}" class="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 focus-visible:-outline-offset-2 sm:px-5 dark:hover:bg-stone-800/40">
							<span class="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500 dark:bg-stone-800">
								{#if LEAVES.find((l) => l.path === t.path)?.icon}{@const I = LEAVES.find((l) => l.path === t.path)!.icon!}<I class="size-4" />{/if}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate font-mono text-xs font-semibold">{d.no}</span>
								<span class="block truncate text-xs text-stone-500">{t.label} · {fdate(d.date)}</span>
							</span>
							{#if d.total && !t.def.noAmount}<span class="hidden text-sm tabular-nums sm:block">{money(d.total)}</span>{/if}
							<StatusBadge status={d.status} labels={t.def.statusLabels} />
						</a>
					</li>
				{:else}
					<li class="px-5 py-8 text-center text-sm text-stone-400">Belum ada aktivitas</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="min-w-0 space-y-4">
		{#if pending.length}
			<div class="card p-4 sm:p-5">
				<div class="mb-3 flex items-center gap-2">
					<Clock class="size-4 text-amber-500" />
					<h2 class="flex-1 font-medium">Menunggu Posting</h2>
					<span class="badge bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">{pending.length}</span>
				</div>
				<ul class="space-y-1">
					{#each pending.slice(0, 6) as { d, t } (t.def.table + d.id)}
						<li>
							<a href="{t.path}?id={d.id}" class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-stone-50 dark:hover:bg-stone-800/50">
								<span class="flex-1 truncate"><span class="font-mono text-xs font-semibold">{d.no}</span> <span class="text-xs text-stone-500">· {t.label}</span></span>
								<ArrowRight class="size-3.5 text-stone-300" />
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if showSales && byStore.length}
			<div class="card p-4 sm:p-5">
				<h2 class="mb-4 font-medium">Omzet per Channel</h2>
				<BarList items={byStore} />
			</div>
		{/if}

		{#if lowStock.length}
			<div class="card p-4 sm:p-5">
				<h2 class="mb-3 font-medium">Stok Gudang Menipis</h2>
				<ul class="space-y-2">
					{#each lowStock as s (s.p.id)}
						<li class="flex items-center gap-3 text-sm">
							<span class="flex-1 truncate">{s.p.name}</span>
							<span class="badge {s.qty <= (s.p.minStock ?? 0) ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'}">{num(s.qty)} pcs</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="card p-4 sm:p-5 lg:hidden">
			<h2 class="mb-3 font-medium">Modul</h2>
			<div class="grid grid-cols-3 gap-2">
				{#each modules as m (m.path)}
					<a href={m.path} class="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-800/50">
						<span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">{#if m.icon}<m.icon class="size-5" />{/if}</span>
						{m.label}
					</a>
				{/each}
			</div>
		</div>
	</div>
</div>
