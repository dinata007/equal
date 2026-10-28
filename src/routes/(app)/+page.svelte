<script lang="ts">
	import { BadgeDollarSign, Boxes, ChartLine, ChevronRight, Plus, ReceiptText, RotateCcw, Sparkles, TrendingDown, TrendingUp, Warehouse } from '@lucide/svelte';
	import KategoriSheet from '#lib/pages/beranda/KategoriSheet.svelte';
	import { MAX_DAYS, MIN_DATE, buckets, loadSales, pctChange, stats, type Sales } from '#lib/pages/beranda/penjualan.ts';
	import { loadPurchases, type Purchases } from '#lib/pages/beranda/pembelian.ts';
	import { loadStock, type Stock } from '#lib/pages/beranda/stok.ts';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { ApiError } from '#lib/util/api.ts';
	import { addDays, date as fdate, monthStart, money, num, short, today } from '#lib/util/format.ts';
	import { LEAVES, MENU, visibleTree } from '#lib/domain/menu.ts';
	import type { CustomPage, ReportPage } from '#lib/domain/types.ts';
	import Menu from '#lib/components/ui/Menu.svelte';
	import DateRangePicker from '#lib/components/ui/DateRangePicker.svelte';
	import Select from '#lib/components/ui/Select.svelte';
	import Delta from '#lib/components/chart/Delta.svelte';
	import Donut, { type Slice } from '#lib/components/chart/Donut.svelte';
	import Heatmap from '#lib/components/chart/Heatmap.svelte';
	import Sparkline from '#lib/components/chart/Sparkline.svelte';
	import TrendChart, { type TrendPoint } from '#lib/components/chart/TrendChart.svelte';

	const T = today();
	const hour = new Date().getHours();
	const greet = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';
	const slot = (i: number) => `var(--viz-${(i % 5) + 1})`;

	const showSales = $derived(auth.canAny('/sales') || auth.canAny('/toko'));
	const showStock = $derived(auth.canAny('/inventory'));
	const leafOf = (component: ReportPage | CustomPage) => LEAVES.find((l) => l.page.kind !== 'transaction' && 'component' in l.page && l.page.component === component && auth.can(l.path));

	/* ---------------- filter (berlaku untuk semua angka penjualan di bawahnya) ---------------- */
	let from = $state(addDays(T, -29));
	let to = $state(T);
	let channel = $state('');
	/** rincian Total Penjualan per kategori */
	let catOpen = $state(false);
	let category = $state('');

	const days = (a: string, b: string) => Math.round((+new Date(b + 'T00:00:00') - +new Date(a + 'T00:00:00')) / 864e5) + 1;
	const per = $derived.by(() => {
		// "Bulan ini" dibandingkan dengan bulan lalu s.d. tanggal yang sama; rentang lain dengan rentang sepanjang itu sebelumnya
		if (from === monthStart(T) && to === T) {
			const prevFrom = monthStart(addDays(from, -1));
			const prevEnd = addDays(from, -1);
			const prevTo = addDays(prevFrom, days(from, to) - 1) < prevEnd ? addDays(prevFrom, days(from, to) - 1) : prevEnd;
			return { from, to, prevFrom, prevTo, size: 1, prevLabel: 'Bulan lalu' };
		}
		const n = days(from, to);
		return { from, to, prevFrom: addDays(from, -n), prevTo: addDays(from, -1), size: n <= 62 ? 1 : 7, prevLabel: n === 1 ? 'Hari sebelumnya' : `${n} hari sebelumnya` };
	});

	/* ---------------- data (langsung dari database; dimuat sesuai rentang) ---------------- */
	let data = $state<Sales | null>(null);
	/** bulan berjalan & bulan lalu untuk proyeksi; sama dengan `data` bila rentangnya sudah mencakup */
	let monthData = $state<Sales | null>(null);
	/** stok gudang: saldo awal bulan + mutasi harian (sampai akhir periode; mulai awal bulan dari periode pembanding) */
	let stock = $state<Stock | null>(null);
	let loading = $state(false);
	let error = $state('');
	const lastMonthStart = monthStart(addDays(monthStart(T), -1));
	let seq = 0;
	async function load(fresh = false) {
		const id = ++seq;
		const [f, t] = [per.prevFrom, per.to];
		loading = true;
		error = '';
		try {
			const [main, stk] = await Promise.all([loadSales(f, t, fresh), showStock ? loadStock(monthStart(f), t, fresh) : null]);
			const month = main.covers(lastMonthStart, T) ? main : await loadSales(lastMonthStart, T, fresh);
			if (id !== seq) return; // rentang sudah diganti lagi
			data = main;
			monthData = month;
			stock = stk;
		} catch (e) {
			if (id === seq) error = e instanceof ApiError ? e.message : 'Data penjualan gagal dimuat';
		} finally {
			if (id === seq) loading = false;
		}
	}
	$effect(() => {
		if (showSales) load();
	});
	const updatedAt = $derived(data?.at.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) ?? '');

	const channels = $derived(data?.channels ?? []);
	const categories = $derived(data?.categories ?? []);
	const catColor = (c: string) => slot(Math.max(0, categories.indexOf(c)));

	const pick = (from: string, to: string, ch = '', cat = '') => data?.pick(from, to, ch, cat) ?? { rows: [], trx: 0 };
	const cur = $derived(pick(per.from, per.to, channel, category));
	const prev = $derived(pick(per.prevFrom, per.prevTo, channel, category));
	const s = $derived(stats(cur));
	const p = $derived(stats(prev));

	const bs = $derived(buckets(per.from, per.to, per.size));
	const pbs = $derived(buckets(per.prevFrom, per.prevTo, per.size));
	const series = $derived(bs.map((b) => stats(pick(b.from, b.to, channel, category))));
	const prevSeries = $derived(pbs.map((b) => stats(pick(b.from, b.to, channel, category))));

	/* stok gudang akhir periode vs akhir periode pembanding */
	const stockNow = $derived(stock?.level(per.to) ?? null);
	const stockPrev = $derived(stock?.level(per.prevTo) ?? null);
	const stockSeries = $derived(bs.map((b) => stock?.level(b.to) ?? { qty: 0, nilai: 0 }));

	/* bulan berjalan vs bulan lalu (tidak terikat periode; ikut filter channel & kategori) */
	const month = $derived.by(() => {
		if (!monthData) return null;
		const ms = monthStart(T);
		const lastFrom = monthStart(addDays(ms, -1));
		const mtd = stats(monthData.pick(ms, T, channel, category)).sales;
		const last = stats(monthData.pick(lastFrom, addDays(ms, -1), channel, category)).sales;
		const d = new Date(T + 'T00:00:00');
		const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
		const projected = (mtd / d.getDate()) * dim;
		return { mtd, last, projected, pct: last ? (projected / last) * 100 : null, progress: last ? Math.min(100, (mtd / last) * 100) : 0 };
	});

	/* ---------------- tren ---------------- */
	type Metric = 'sales' | 'trx';
	let metric = $state<Metric>('sales');
	const METRICS: { key: Metric; label: string }[] = [
		{ key: 'sales', label: 'Penjualan' },
		{ key: 'trx', label: 'Transaksi' }
	];
	const dShort = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
	const dLong = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
	const dt = (s: string) => new Date(s + 'T00:00:00');
	/* pembanding: periode sebelumnya, atau pembelian (penerimaan barang gudang) pada periode yang sama */
	let compare = $state<'prev' | 'beli'>('prev');
	let purchases = $state<Purchases | null>(null);
	let purchError = $state('');
	$effect(() => {
		if (compare !== 'beli' || !showStock) return;
		const [f, t] = [per.from, per.to];
		purchError = '';
		loadPurchases(f, t)
			.then((p) => (per.from === f && per.to === t ? (purchases = p) : null))
			.catch((e) => (purchError = e instanceof ApiError ? e.message : 'Data pembelian gagal dimuat'));
	});
	const vsBeli = $derived(compare === 'beli' && showStock);
	const purchaseSeries = $derived(purchases && purchases.from === per.from && purchases.to === per.to ? bs.map((b) => purchases!.sum(b.from, b.to, category)) : null);
	const trend = $derived<TrendPoint[]>(
		bs.map((b, i) => ({
			label: dShort.format(dt(b.from)),
			title: per.size === 1 ? dLong.format(dt(b.from)) : `${dShort.format(dt(b.from))} – ${dShort.format(dt(b.to))}`,
			cur: series[i][vsBeli ? 'sales' : metric],
			prev: vsBeli ? (purchaseSeries ? purchaseSeries[i] : null) : prevSeries[i] ? prevSeries[i][metric] : null
		}))
	);
	const metricFmt = $derived(metric === 'trx' && !vsBeli ? (v: number) => num(Math.round(v)) + ' trx' : short);
	const purchaseTotal = $derived(purchaseSeries?.reduce((t, v) => t + v, 0) ?? 0);

	/* ---------------- kategori (sumber filter kategori: tetap tampil semua kategori) ---------------- */
	let catMeasure = $state<'amount' | 'qty'>('amount');
	const catSlices = $derived.by<Slice[]>(() => {
		const rows = pick(per.from, per.to, channel).rows;
		return categories.map((c) => ({
			key: c,
			label: c,
			color: catColor(c),
			value: rows.filter((l) => l.cat === c).reduce((t, l) => t + (catMeasure === 'qty' ? l.qty : l.amount), 0)
		}));
	});

	/* ---------------- channel (sumber filter channel: tetap tampil semua channel) ---------------- */
	const chRows = $derived.by(() => {
		const total = stats(pick(per.from, per.to, '', category)).sales;
		return channels
			.map((ch) => {
				const st = stats(pick(per.from, per.to, ch.id, category));
				const ps = stats(pick(per.prevFrom, per.prevTo, ch.id, category));
				return { ...ch, st, growth: pctChange(st.sales, ps.sales), share: total ? (st.sales / total) * 100 : 0 };
			})
			.filter((r) => r.st.sales || r.st.trx)
			.sort((a, b) => b.st.sales - a.st.sales);
	});

	/* ---------------- pola harian: rata-rata penjualan per hari dalam minggu ---------------- */
	const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
	const heat = $derived.by(() => {
		const rows = chRows.filter((c) => !channel || c.id === channel);
		const count = Array(7).fill(0);
		for (let d = per.from; d <= per.to; d = addDays(d, 1)) count[(dt(d).getDay() + 6) % 7]++;
		const values = rows.map((r) => {
			const sums = Array(7).fill(0);
			for (const l of cur.rows) if (l.ch === r.id) sums[(dt(l.date).getDay() + 6) % 7] += l.amount;
			return sums.map((v, i) => (count[i] ? v / count[i] : 0));
		});
		return { rows: rows.map((r) => r.name.replace(' / Corporate', '')), values };
	});

	/* ---------------- produk terlaris ---------------- */
	let prodSort = $state<'amount' | 'qty'>('amount');
	const topProducts = $derived.by(() => {
		const m = new Map<string, { cat: string; qty: number; amount: number }>();
		for (const l of cur.rows) {
			const r = m.get(l.item) ?? { cat: l.cat, qty: 0, amount: 0 };
			r.qty += l.qty;
			r.amount += l.amount;
			m.set(l.item, r);
		}
		const rows = [...m.entries()].map(([name, r]) => ({ name, ...r })).sort((a, b) => b[prodSort] - a[prodSort]);
		const max = rows[0]?.[prodSort] ?? 1;
		return rows.slice(0, 10).map((r) => ({ ...r, bar: (r[prodSort] / max) * 100 }));
	});

	/* ---------------- insight otomatis ---------------- */
	const insights = $derived.by(() => {
		const out: { tone: 'up' | 'down' | 'info'; lead: string; text: string }[] = [];
		if (!cur.rows.length) return out;
		const g = chRows.filter((r) => r.growth != null && r.st.sales > 0 && (!channel || r.id === channel)).sort((a, b) => Math.abs(b.growth!) - Math.abs(a.growth!))[0];
		if (g) out.push({ tone: g.growth! >= 0 ? 'up' : 'down', lead: `${g.name} ${g.growth! >= 0 ? 'naik' : 'turun'} ${num(Math.round(Math.abs(g.growth!)))}%`, text: `vs ${per.prevLabel.toLowerCase()} · ${short(g.st.sales)}` });
		const cat = [...catSlices].sort((a, b) => b.value - a.value)[0];
		const catTotal = catSlices.reduce((t, c) => t + c.value, 0);
		if (cat?.value && !category) out.push({ tone: 'info', lead: `${cat.label} menyumbang ${num(Math.round((cat.value / catTotal) * 100))}%`, text: `${catMeasure === 'qty' ? 'qty' : 'nilai'} penjualan periode ini` });
		const dowTotals = DOW.map((_, i) => heat.values.reduce((t, r) => t + r[i], 0));
		const best = dowTotals.indexOf(Math.max(...dowTotals));
		if (dowTotals[best] > 0) out.push({ tone: 'info', lead: `${['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][best]} paling ramai`, text: `rata-rata ${short(dowTotals[best])} per hari` });
		const top = topProducts[0];
		if (top) out.push({ tone: 'info', lead: `${top.name} terlaris`, text: `${num(top.qty)} pcs · ${short(top.amount)}` });
		return out.slice(0, 4);
	});

	const shortcuts = $derived(LEAVES.filter((l) => l.page.kind === 'transaction' && auth.can(l.path, 'create')).map((l) => ({ label: l.label, icon: l.icon, href: `${l.path}?id=new`, section: l.module.label })));
	const modules = $derived(visibleTree(MENU, (pth) => auth.can(pth)));
	const analysis = $derived(leafOf('analisa-penjualan'));
	const filtered = $derived(!!channel || !!category);
	const periodText = $derived(`${fdate(per.from)} – ${fdate(per.to)}`);
</script>

<svelte:head><title>Dashboard · Senja</title></svelte:head>

{#snippet seg<K extends string>(opts: { key: K; label: string }[], value: K, set: (k: K) => void, label: string)}
	<div class="inline-flex rounded-xl bg-stone-100 p-0.5 dark:bg-stone-800" role="group" aria-label={label}>
		{#each opts as o (o.key)}
			<button
				type="button"
				class="h-8 rounded-[10px] px-3 text-sm font-medium whitespace-nowrap transition {value === o.key
					? 'bg-white text-stone-900 shadow-xs dark:bg-stone-950 dark:text-stone-100'
					: 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}"
				aria-pressed={value === o.key}
				onclick={() => set(o.key)}>{o.label}</button
			>
		{/each}
	</div>
{/snippet}

{#snippet kpi(icon: typeof ReceiptText, color: string, label: string, value: string, full: string, delta: number | null, spark: number[], foot?: string, upGood = true, onclick?: () => void)}
	{@const Icon = icon}
	<!-- svelte-ignore a11y_no_static_element_interactions (menjadi <button> bila onclick ada) -->
	<svelte:element
		this={onclick ? 'button' : 'div'}
		type={onclick ? 'button' : undefined}
		{onclick}
		class="card relative flex min-w-0 flex-col overflow-hidden p-3.5 sm:p-4 {onclick ? 'w-full cursor-pointer text-left transition hover:border-stone-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none dark:hover:border-stone-600' : ''}"
	>
		<div class="flex items-start gap-3">
			<span class="hidden size-10 shrink-0 place-items-center rounded-xl sm:grid" style="background:color-mix(in oklab, {color} 13%, transparent);color:{color}"><Icon class="size-5" /></span>
			<div class="min-w-0 flex-1">
				<p class="truncate text-xs text-stone-500">{label}</p>
				<p class="truncate text-xl font-semibold tracking-tight sm:text-2xl" title={full}>{value}</p>
			</div>
		</div>
		<div class="mt-1.5 flex items-center gap-1.5 text-xs sm:mt-2">
			<Delta value={delta} {upGood} />
			<span class="truncate text-stone-400">{foot ?? 'vs ' + per.prevLabel.toLowerCase()}</span>
		</div>
		<div class="-mx-1 mt-auto pt-2"><Sparkline values={spark} height={34} {color} /></div>
		{#if onclick}<span class="absolute top-3 right-3 inline-flex items-center gap-0.5 text-[11px] text-stone-400">Detail <ChevronRight class="size-3" /></span>{/if}
	</svelte:element>
{/snippet}

<!-- kepala -->
<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
	<div>
		<p class="text-sm text-stone-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
		<h1 class="text-2xl font-medium">{greet}, {auth.user?.name.split(' ')[0]} 👋</h1>
	</div>
	<div class="flex items-center gap-2">
		{#if showSales && data}<button class="btn btn-ghost btn-sm" onclick={() => load(true)} disabled={loading}><RotateCcw class="size-3.5 {loading ? 'animate-spin' : ''}" /> Refresh<span class="hidden text-stone-400 sm:inline">· {updatedAt}</span></button>{/if}
		{#if analysis}<a href={analysis.path} class="btn btn-secondary"><ChartLine class="size-4" /><span class="hidden sm:inline">Analisa Lengkap</span></a>{/if}
		{#if shortcuts.length}
			<Menu items={shortcuts}>
				{#snippet trigger(props)}
					<button {...props} class="btn btn-primary"><Plus class="size-4" /> Buat Baru</button>
				{/snippet}
			</Menu>
		{/if}
	</div>
</div>

{#if showSales && !data}
	<div class="card mb-4 grid place-items-center px-4 py-16 text-center">
		{#if error}
			<p class="font-medium">{error}</p>
			<button class="btn btn-secondary mt-4" onclick={() => load(true)}><RotateCcw class="size-4" /> Coba lagi</button>
		{:else}
			<p class="text-sm text-stone-500">Memuat data penjualan…</p>
		{/if}
	</div>
{:else if showSales && data}
	<!-- filter: satu baris, mengatur semua angka penjualan di bawahnya -->
	<div class="card mb-4 flex flex-wrap items-center gap-2 p-2 sm:gap-3">
		<DateRangePicker bind:from bind:to min={MIN_DATE} maxDays={MAX_DAYS} />
		<div class="w-[calc(50%-0.25rem)] sm:w-48">
			<Select bind:value={channel} options={[{ value: '', label: 'Semua toko' }, ...channels.map((c) => ({ value: c.id, label: c.name, hint: c.city }))]} label="Toko" compact />
		</div>
		<div class="w-[calc(50%-0.25rem)] sm:w-44">
			<Select bind:value={category} options={[{ value: '', label: 'Semua kategori' }, ...categories]} label="Kategori" compact />
		</div>
		{#if filtered}
			<button class="btn btn-ghost btn-sm" onclick={() => ((channel = ''), (category = ''))}><RotateCcw class="size-3.5" /> Reset</button>
		{/if}
		<span class="ml-auto hidden text-xs text-stone-400 lg:inline">dibanding {fdate(per.prevFrom)} – {fdate(per.prevTo)}</span>
	</div>

	<!-- KPI -->
	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
		{@render kpi(BadgeDollarSign, 'var(--viz-1)', 'Total Penjualan', short(s.sales), money(s.sales), pctChange(s.sales, p.sales), series.map((x) => x.sales), undefined, true, () => (catOpen = true))}
		{@render kpi(ReceiptText, 'var(--viz-3)', 'Jumlah Transaksi', num(s.trx), `${num(s.qty)} pcs terjual`, pctChange(s.trx, p.trx), series.map((x) => x.trx))}
		{#if showStock && stockNow}
			{@render kpi(Boxes, 'var(--viz-5)', 'Stok Gudang', num(stockNow.qty), `${num(stockNow.qty)} pcs per ${fdate(per.to)}`, stockPrev ? pctChange(stockNow.qty, stockPrev.qty) : null, stockSeries.map((x) => x.qty), 'vs akhir ' + per.prevLabel.toLowerCase().replace(/ sebelumnya$/, ' lalu').replace(/^bulan lalu$/, 'bulan lalu'))}
			{@render kpi(Warehouse, 'var(--viz-2)', 'Nilai Persediaan', short(stockNow.nilai), money(stockNow.nilai), stockPrev ? pctChange(stockNow.nilai, stockPrev.nilai) : null, stockSeries.map((x) => x.nilai), 'harga beli · vs periode lalu')}
		{/if}
		{#if month}
			<div class="card col-span-2 flex flex-col p-3.5 sm:p-4 lg:col-span-1">
				<div class="flex items-start gap-3">
					<span class="grid size-10 shrink-0 place-items-center rounded-xl" style="background:color-mix(in oklab, var(--viz-4) 15%, transparent);color:var(--viz-4)"><TrendingUp class="size-5" /></span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-xs text-stone-500">Proyeksi Bulan Ini</p>
						<p class="truncate text-xl font-semibold tracking-tight sm:text-2xl" title={money(month.projected)}>{short(month.projected)}</p>
					</div>
				</div>
				<p class="mt-2 flex items-center gap-1.5 text-xs">
					<Delta value={month.pct == null ? null : month.pct - 100} />
					<span class="truncate text-stone-400">vs total bulan lalu</span>
				</p>
				<div class="mt-auto pt-3">
					<div class="mb-1.5 flex justify-between text-[11px] text-stone-500">
						<span>Berjalan <b class="font-semibold text-stone-800 dark:text-stone-200">{short(month.mtd)}</b></span>
						<span>Bulan lalu {short(month.last)}</span>
					</div>
					<div class="h-2 rounded-full" style="background:var(--seq-1)" role="meter" aria-valuenow={Math.round(month.progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Capaian berjalan terhadap bulan lalu">
						<div class="h-2 rounded-full transition-[width] duration-500" style="width:{month.progress}%;background:var(--viz-1)"></div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- insight otomatis -->
	{#if insights.length}
		<div class="-mx-3 mb-4 flex snap-x gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 2xl:grid-cols-4">
			{#each insights as ins, i (i)}
				<div class="card flex w-[78%] shrink-0 snap-start items-center gap-3 px-4 py-3 sm:w-auto">
					<span class="grid size-8 shrink-0 place-items-center rounded-lg {ins.tone === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : ins.tone === 'down' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' : 'bg-brand-100 text-brand-700 dark:bg-brand-500/15'}">
						{#if ins.tone === 'up'}<TrendingUp class="size-4" />{:else if ins.tone === 'down'}<TrendingDown class="size-4" />{:else}<Sparkles class="size-4" />{/if}
					</span>
					<p class="min-w-0 text-sm leading-snug"><span class="block truncate font-medium">{ins.lead}</span><span class="block truncate text-xs text-stone-500">{ins.text}</span></p>
				</div>
			{/each}
		</div>
	{/if}

	<div class="mb-4 grid gap-4 xl:grid-cols-12">
		<!-- tren -->
		<section class="card min-w-0 p-4 sm:p-5 xl:col-span-8">
			<div class="mb-3 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 class="font-medium">{vsBeli ? 'Penjualan vs Pembelian' : `Tren ${METRICS.find((m) => m.key === metric)?.label}`}</h2>
					<div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
						<span class="inline-flex items-center gap-1.5"><span class="h-0.5 w-4 rounded-full" style="background:var(--viz-1)"></span>{vsBeli ? 'Penjualan' : `${per.size === 7 ? 'Mingguan, ' : 'Harian, '}periode ini`}</span>
						<span class="inline-flex items-center gap-1.5"><span class="h-0.5 w-4 rounded-full" style="background:{vsBeli ? 'var(--viz-2)' : 'var(--viz-muted)'}"></span>{vsBeli ? 'Pembelian (penerimaan barang)' : per.prevLabel}</span>
					</div>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					{#if showStock}{@render seg([{ key: 'prev', label: 'vs Periode lalu' }, { key: 'beli', label: 'vs Pembelian' }], compare, (k) => (compare = k), 'Pembanding tren')}{/if}
					{#if !vsBeli}{@render seg(METRICS, metric, (k) => (metric = k), 'Ukuran tren')}{/if}
				</div>
			</div>
			<TrendChart
				points={trend}
				fmt={metricFmt}
				curLabel={vsBeli ? 'Penjualan' : 'Periode ini'}
				prevLabel={vsBeli ? 'Pembelian' : per.prevLabel}
				prevColor={vsBeli ? 'var(--viz-2)' : 'var(--viz-muted)'}
				delta={!vsBeli}
				ariaLabel="{vsBeli ? 'Penjualan vs pembelian' : `Tren ${METRICS.find((m) => m.key === metric)?.label}`} {periodText}"
			/>
			{#if vsBeli}
				<p class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-100 pt-3 text-xs text-stone-500 dark:border-stone-800">
					{#if purchError}
						<span class="text-rose-600 dark:text-rose-400">{purchError}</span>
					{:else if !purchaseSeries}
						<span>Memuat data pembelian…</span>
					{:else}
						<span>Penjualan <b class="font-semibold text-stone-800 dark:text-stone-200" title={money(s.sales)}>{short(s.sales)}</b></span>
						<span>Pembelian <b class="font-semibold text-stone-800 dark:text-stone-200" title={money(purchaseTotal)}>{short(purchaseTotal)}</b></span>
						{#if purchaseTotal}<span>Penjualan {num(Math.round((s.sales / purchaseTotal) * 10) / 10)}× pembelian</span>{/if}
						{#if channel}<span class="text-stone-400">Pembelian tidak terpengaruh filter toko</span>{/if}
					{/if}
				</p>
			{/if}
		</section>

		<!-- kategori -->
		<section class="card min-w-0 p-4 sm:p-5 xl:col-span-4">
			<div class="mb-4 flex items-start justify-between gap-3">
				<div>
					<h2 class="font-medium">Penjualan per Kategori</h2>
					<p class="text-xs text-stone-500">Klik untuk memfilter dashboard</p>
				</div>
				{@render seg([{ key: 'amount', label: 'Nilai' }, { key: 'qty', label: 'Qty' }], catMeasure, (k) => (catMeasure = k), 'Ukuran kategori')}
			</div>
			<Donut
				items={catSlices}
				fmt={catMeasure === 'qty' ? (v) => num(v) + ' pcs' : short}
				centerLabel={catMeasure === 'qty' ? 'Total qty' : 'Total penjualan'}
				selected={category}
				onselect={(k) => (category = category === k ? '' : k)}
			/>
		</section>
	</div>

	<div class="mb-4 grid gap-4 xl:grid-cols-12">
		<!-- kinerja channel -->
		<section class="card min-w-0 overflow-hidden xl:col-span-7">
			<div class="flex items-start justify-between gap-3 px-4 pt-4 pb-2 sm:px-5">
				<div>
					<h2 class="font-medium">Kinerja Toko</h2>
					<p class="text-xs text-stone-500">Klik baris untuk memfilter dashboard</p>
				</div>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
							<th class="py-2 pr-2 pl-4 font-semibold sm:pl-5">Toko</th>
							<th class="px-2 py-2 text-right font-semibold">Penjualan</th>
							<th class="hidden px-2 py-2 text-right font-semibold sm:table-cell">Trx</th>
							<th class="px-2 py-2 text-right font-semibold">Tumbuh</th>
							<th class="hidden py-2 pr-5 pl-2 font-semibold sm:table-cell">Kontribusi</th>
						</tr>
					</thead>
					<tbody>
						{#each chRows as r (r.id)}
							<tr
								class="cursor-pointer border-t border-stone-100 transition hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/40 {channel === r.id ? 'bg-stone-50 dark:bg-stone-800/60' : ''} {channel && channel !== r.id ? 'opacity-45' : ''}"
								onclick={() => (channel = channel === r.id ? '' : r.id)}
							>
								<td class="py-2.5 pr-2 pl-4 sm:pl-5">
									<button type="button" class="block max-w-44 text-left" aria-pressed={channel === r.id}>
										<span class="block truncate font-medium">{r.name}</span>
										<span class="block truncate text-xs text-stone-400">{r.city}</span>
									</button>
								</td>
								<td class="px-2 py-2.5 text-right font-medium tabular-nums" title={money(r.st.sales)}>{short(r.st.sales)}</td>
								<td class="hidden px-2 py-2.5 text-right tabular-nums sm:table-cell">{num(r.st.trx)}</td>
								<td class="px-2 py-2.5 text-right"><Delta value={r.growth} /></td>
								<td class="hidden py-2.5 pr-5 pl-2 sm:table-cell">
									<div class="flex items-center gap-2">
										<div class="h-1.5 min-w-16 flex-1 rounded-full" style="background:var(--viz-grid)">
											<div class="h-1.5 rounded-full" style="width:{r.share}%;background:var(--viz-1)"></div>
										</div>
										<span class="w-11 text-right text-xs tabular-nums text-stone-500">{num(Math.round(r.share * 10) / 10)}%</span>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<!-- pola harian -->
		<section class="card min-w-0 p-4 sm:p-5 xl:col-span-5">
			<h2 class="font-medium">Pola Penjualan Mingguan</h2>
			<p class="mb-3 text-xs text-stone-500">Rata-rata penjualan per hari, per toko</p>
			<Heatmap rows={heat.rows} cols={DOW} values={heat.values} fmt={money} cellFmt={(v) => (v >= 1e6 ? (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt' : Math.round(v / 1e3) + 'rb')} />
		</section>
	</div>

	<div class="mb-4 grid gap-4 xl:grid-cols-12">
		<!-- produk terlaris -->
		<section class="card min-w-0 p-4 sm:p-5 xl:col-span-12">
			<div class="mb-3 flex items-start justify-between gap-3">
				<h2 class="font-medium">Produk Terlaris</h2>
				{@render seg([{ key: 'amount', label: 'Nilai' }, { key: 'qty', label: 'Qty' }], prodSort, (k) => (prodSort = k), 'Urutkan produk')}
			</div>
			<ol class="grid gap-x-10 gap-y-1 xl:grid-cols-2">
				{#each topProducts as r, i (r.name)}
					<li class="flex items-center gap-3 rounded-xl px-1 py-1.5">
						<span class="grid size-7 shrink-0 place-items-center rounded-lg text-xs font-semibold {i === 0 ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}">{i + 1}</span>
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-3">
								<span class="truncate text-sm font-medium">{r.name}</span>
								<span class="shrink-0 text-sm font-medium tabular-nums">{prodSort === 'qty' ? num(r.qty) + ' pcs' : short(r.amount)}</span>
							</div>
							<div class="mt-1 flex items-center gap-2">
								<span class="inline-flex w-24 shrink-0 items-center gap-1.5 truncate text-[11px] text-stone-400"><span class="size-2 rounded-[2px]" style="background:{catColor(r.cat)}"></span>{r.cat}</span>
								<div class="h-1.5 flex-1 rounded-full" style="background:var(--viz-grid)"><div class="h-1.5 rounded-full" style="width:{r.bar}%;background:var(--viz-1)"></div></div>
								<span class="w-24 shrink-0 text-right text-[11px] text-stone-400 tabular-nums">{prodSort === 'qty' ? short(r.amount) : num(r.qty) + ' pcs'}</span>
							</div>
						</div>
					</li>
				{:else}
					<li class="py-10 text-center text-sm text-stone-400">Belum ada penjualan pada filter ini</li>
				{/each}
			</ol>
		</section>

	</div>
{/if}

<div class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
	<section class="card p-4 sm:p-5 lg:hidden">
		<h2 class="mb-3 font-medium">Modul</h2>
		<div class="grid grid-cols-3 gap-2">
			{#each modules as m (m.path)}
				<a href={m.path} class="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-800/50">
					<span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">{#if m.icon}<m.icon class="size-5" />{/if}</span>
					{m.label}
				</a>
			{/each}
		</div>
	</section>
</div>

{#if data}
	<KategoriSheet bind:open={catOpen} {data} {per} {channel} channelName={channels.find((c) => c.id === channel)?.name ?? ''} {category} color={catColor} />
{/if}
