<script lang="ts">
	import {
		AlertTriangle,
		ArrowRight,
		BadgeDollarSign,
		Boxes,
		CalendarClock,
		ChartLine,
		CircleDollarSign,
		Clock,
		Landmark,
		Lock,
		PackageSearch,
		Plus,
		ReceiptText,
		RotateCcw,
		ShoppingBag,
		Sparkles,
		TrendingDown,
		TrendingUp,
		Truck,
		Wallet
	} from '@lucide/svelte';
	import { GROSIR, bucketStats, buckets, categoryOrder, pctChange, saleLines, saleStats, type SaleLine } from '#lib/erp/analytics.ts';
	import { auth } from '#lib/erp/auth.svelte.ts';
	import { db } from '#lib/erp/db.svelte.ts';
	import { addDays, date as fdate, monthStart, money, num, short, today } from '#lib/erp/format.ts';
	import { cashMoves, lastClosing, locMatch, openItems, partyMoves, stockOnHand } from '#lib/erp/ledger.ts';
	import { LEAVES, MENU, TX, visibleTree } from '#lib/erp/menu.ts';
	import type { Doc, Row } from '#lib/erp/types.ts';
	import Menu from '#lib/components/Menu.svelte';
	import Select from '#lib/components/Select.svelte';
	import Delta from '#lib/components/dash/Delta.svelte';
	import Donut, { type Slice } from '#lib/components/dash/Donut.svelte';
	import Heatmap from '#lib/components/dash/Heatmap.svelte';
	import Sparkline from '#lib/components/dash/Sparkline.svelte';
	import StackBar from '#lib/components/dash/StackBar.svelte';
	import TrendChart, { type TrendPoint } from '#lib/components/dash/TrendChart.svelte';
	import { tooltip } from '#lib/ui/tooltip.ts';

	const T = today();
	const hour = new Date().getHours();
	const greet = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';
	const updatedAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	const slot = (i: number) => `var(--viz-${(i % 5) + 1})`;

	const showSales = $derived(auth.canAny('/sales') || auth.canAny('/toko'));
	const showFin = $derived(auth.canAny('/akunting'));
	const showInv = $derived(auth.canAny('/inventory'));
	const leafOf = (component: string, match: (p: Record<string, any>) => boolean = () => true) =>
		LEAVES.find((l) => l.page.kind !== 'transaction' && 'component' in l.page && l.page.component === component && match(l.page.props ?? {}) && auth.can(l.path));

	/* ---------------- filter (berlaku untuk semua angka penjualan di bawahnya) ---------------- */
	type RangeKey = '7' | '30' | '90' | 'mtd';
	const RANGES: { key: RangeKey; label: string }[] = [
		{ key: '7', label: '7 hari' },
		{ key: '30', label: '30 hari' },
		{ key: '90', label: '3 bulan' },
		{ key: 'mtd', label: 'Bulan ini' }
	];
	let range = $state<RangeKey>('30');
	let channel = $state('');
	let category = $state('');

	const per = $derived.by(() => {
		if (range === 'mtd') {
			const from = monthStart(T);
			const span = Number(T.slice(8)) - 1;
			const prevFrom = monthStart(addDays(from, -1));
			const prevEnd = addDays(from, -1);
			const prevTo = addDays(prevFrom, span) < prevEnd ? addDays(prevFrom, span) : prevEnd;
			return { from, to: T, prevFrom, prevTo, size: 1, prevLabel: 'Bulan lalu' };
		}
		const days = range === '90' ? 91 : Number(range);
		const from = addDays(T, -(days - 1));
		return { from, to: T, prevFrom: addDays(from, -days), prevTo: addDays(from, -1), size: range === '90' ? 7 : 1, prevLabel: `${days === 91 ? '3 bulan' : days + ' hari'} sebelumnya` };
	});

	const stores = $derived(db.all<Row>('stores'));
	const channels = $derived([
		...stores.map((s) => ({ id: s.id as string, name: s.name as string, city: s.city as string })),
		{ id: GROSIR, name: 'Grosir / Corporate', city: 'Penjualan B2B' }
	]);
	const categories = $derived(categoryOrder());
	const catColor = (c: string) => slot(Math.max(0, categories.indexOf(c)));

	const rawCur = $derived(showSales ? saleLines(per.from, per.to) : []);
	const rawPrev = $derived(showSales ? saleLines(per.prevFrom, per.prevTo) : []);
	const byCh = (l: SaleLine) => !channel || l.channelId === channel;
	const byCat = (l: SaleLine) => !category || l.category === category;
	const cur = $derived(rawCur.filter((l) => byCh(l) && byCat(l)));
	const prev = $derived(rawPrev.filter((l) => byCh(l) && byCat(l)));
	const s = $derived(saleStats(cur));
	const p = $derived(saleStats(prev));

	const bs = $derived(buckets(per.from, per.to, per.size));
	const pbs = $derived(buckets(per.prevFrom, per.prevTo, per.size));
	const series = $derived(bucketStats(cur, bs));
	const prevSeries = $derived(bucketStats(prev, pbs));

	/* bulan berjalan vs bulan lalu (tidak terikat periode; ikut filter channel & kategori) */
	const month = $derived.by(() => {
		if (!showSales) return null;
		const ms = monthStart(T);
		const lastFrom = monthStart(addDays(ms, -1));
		const mtd = saleStats(saleLines(ms, T).filter((l) => byCh(l) && byCat(l))).sales;
		const last = saleStats(saleLines(lastFrom, addDays(ms, -1)).filter((l) => byCh(l) && byCat(l))).sales;
		const d = new Date(T + 'T00:00:00');
		const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
		const projected = (mtd / d.getDate()) * dim;
		return { mtd, last, projected, pct: last ? (projected / last) * 100 : null, progress: last ? Math.min(100, (mtd / last) * 100) : 0 };
	});

	/* ---------------- tren ---------------- */
	type Metric = 'sales' | 'trx' | 'profit';
	let metric = $state<Metric>('sales');
	const METRICS: { key: Metric; label: string }[] = [
		{ key: 'sales', label: 'Penjualan' },
		{ key: 'trx', label: 'Transaksi' },
		{ key: 'profit', label: 'Laba Kotor' }
	];
	const dShort = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
	const dLong = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
	const dt = (s: string) => new Date(s + 'T00:00:00');
	const trend = $derived<TrendPoint[]>(
		bs.map((b, i) => ({
			label: dShort.format(dt(b.from)),
			title: per.size === 1 ? dLong.format(dt(b.from)) : `${dShort.format(dt(b.from))} – ${dShort.format(dt(b.to))}`,
			cur: series[i][metric],
			prev: prevSeries[i] ? prevSeries[i][metric] : null
		}))
	);
	const metricFmt = $derived(metric === 'trx' ? (v: number) => num(Math.round(v)) + ' trx' : short);

	/* ---------------- kategori (sumber filter kategori: tetap tampil semua kategori) ---------------- */
	let catMeasure = $state<'amount' | 'qty'>('amount');
	const catSlices = $derived<Slice[]>(
		categories.map((c) => ({
			key: c,
			label: c,
			color: catColor(c),
			value: rawCur.filter((l) => byCh(l) && l.category === c).reduce((t, l) => t + l[catMeasure], 0)
		}))
	);

	/* ---------------- channel (sumber filter channel: tetap tampil semua channel) ---------------- */
	const chRows = $derived.by(() => {
		const c = rawCur.filter(byCat);
		const pv = rawPrev.filter(byCat);
		const total = saleStats(c).sales;
		return channels
			.map((ch) => {
				const st = saleStats(c.filter((l) => l.channelId === ch.id));
				const ps = saleStats(pv.filter((l) => l.channelId === ch.id));
				return { ...ch, st, growth: pctChange(st.sales, ps.sales), share: total ? (st.sales / total) * 100 : 0 };
			})
			.sort((a, b) => b.st.sales - a.st.sales);
	});

	/* ---------------- pola harian: rata-rata penjualan per hari dalam minggu ---------------- */
	const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
	const heat = $derived.by(() => {
		const rows = channels.filter((c) => !channel || c.id === channel);
		const count = Array(7).fill(0);
		for (let d = per.from; d <= per.to; d = addDays(d, 1)) count[(dt(d).getDay() + 6) % 7]++;
		const values = rows.map((r) => {
			const sums = Array(7).fill(0);
			for (const l of cur) if (l.channelId === r.id) sums[(dt(l.date).getDay() + 6) % 7] += l.amount;
			return sums.map((v, i) => (count[i] ? v / count[i] : 0));
		});
		return { rows: rows.map((r) => r.name.replace(/^Senja /, '').replace(' / Corporate', '')), values };
	});

	/* ---------------- produk terlaris ---------------- */
	let prodSort = $state<'amount' | 'qty'>('amount');
	const topProducts = $derived.by(() => {
		const m = new Map<string, { qty: number; amount: number }>();
		for (const l of cur) {
			const r = m.get(l.itemId) ?? { qty: 0, amount: 0 };
			r.qty += l.qty;
			r.amount += l.amount;
			m.set(l.itemId, r);
		}
		const rows = [...m.entries()].map(([id, r]) => ({ p: db.get('products', id), ...r })).sort((a, b) => b[prodSort] - a[prodSort]);
		const max = rows[0]?.[prodSort] ?? 1;
		return rows.slice(0, 6).map((r) => ({ ...r, bar: (r[prodSort] / max) * 100 }));
	});

	/* ---------------- komposisi pelanggan & pembayaran ---------------- */
	const SEGMENTS: [string, string][] = [
		['Retail', 'Umum (walk-in)'],
		['Member', 'Member'],
		['Corporate', 'Corporate']
	];
	const segSlices = $derived.by<Slice[]>(() => {
		const type = new Map(db.all('customers').map((c) => [c.id, c.type as string]));
		return SEGMENTS.map(([key, label], i) => ({ key, label, color: slot(i), value: cur.filter((l) => (type.get(l.customerId) ?? 'Retail') === key).reduce((t, l) => t + l.amount, 0) }));
	});
	const segBuyers = $derived(new Set(cur.filter((l) => l.customerId && l.customerId !== 'cus-CUS-0001').map((l) => l.customerId)).size);
	const PAYMENTS: [string, string][] = [
		['Tunai', 'Tunai'],
		['Debit', 'Debit'],
		['QRIS', 'QRIS'],
		['Kartu Kredit', 'Kartu Kredit'],
		['Kredit', 'Tempo (grosir)']
	];
	const paySlices = $derived<Slice[]>(PAYMENTS.map(([key, label], i) => ({ key, label, color: slot(i), value: cur.filter((l) => l.payment === key).reduce((t, l) => t + l.amount, 0) })));

	/* ---------------- insight otomatis ---------------- */
	const insights = $derived.by(() => {
		const out: { tone: 'up' | 'down' | 'info'; lead: string; text: string }[] = [];
		if (!cur.length) return out;
		const g = chRows.filter((r) => r.growth != null && r.st.sales > 0 && (!channel || r.id === channel)).sort((a, b) => Math.abs(b.growth!) - Math.abs(a.growth!))[0];
		if (g) out.push({ tone: g.growth! >= 0 ? 'up' : 'down', lead: `${g.name} ${g.growth! >= 0 ? 'naik' : 'turun'} ${num(Math.round(Math.abs(g.growth!)))}%`, text: `vs ${per.prevLabel.toLowerCase()} · ${short(g.st.sales)}` });
		const cat = [...catSlices].sort((a, b) => b.value - a.value)[0];
		const catTotal = catSlices.reduce((t, c) => t + c.value, 0);
		if (cat?.value && !category) out.push({ tone: 'info', lead: `${cat.label} menyumbang ${num(Math.round((cat.value / catTotal) * 100))}%`, text: `${catMeasure === 'qty' ? 'qty' : 'nilai'} penjualan periode ini` });
		const dowTotals = DOW.map((_, i) => heat.values.reduce((t, r) => t + r[i], 0));
		const best = dowTotals.indexOf(Math.max(...dowTotals));
		if (dowTotals[best] > 0) out.push({ tone: 'info', lead: `${['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][best]} paling ramai`, text: `rata-rata ${short(dowTotals[best])} per hari` });
		const top = topProducts[0];
		if (top?.p) out.push({ tone: 'info', lead: `${top.p.name} terlaris`, text: `${num(top.qty)} pcs · ${short(top.amount)}` });
		return out.slice(0, 4);
	});

	/* ---------------- operasional (sesuai hak akses) ---------------- */
	const arLeaf = $derived(leafOf('party-card', (p) => p.kind === 'ar'));
	const stockLeaf = $derived(leafOf('stock-card', (p) => p.scope === 'INV'));
	const finance = $derived.by(() => {
		if (!showFin) return null;
		const bal = (kind: 'ar' | 'ap') => partyMoves(kind).reduce((t, m) => t + m.inc - m.dec, 0);
		const cash = db.all('cashbanks').reduce((t, k) => t + (+k.opening || 0), 0) + cashMoves().reduce((t, m) => t + m.in - m.out, 0);
		return { ar: bal('ar'), ap: bal('ap'), cash };
	});
	const stockValue = $derived.by(() => {
		if (!showInv) return 0;
		const oh = stockOnHand('products', (l) => l === 'INV' || l.startsWith('TOKO:'));
		return db.all('products').reduce((t, pr) => t + (oh.get(pr.id) ?? 0) * (pr.buyPrice ?? 0), 0);
	});
	const receivables = $derived.by(() => {
		if (!showFin) return [];
		return openItems('ar')
			.filter((i) => i.left >= 1)
			.map((i) => ({ ...i, days: Math.round((+dt(T) - +dt(i.due)) / 864e5), name: db.name('customers', i.partyId) }))
			.sort((a, b) => b.days - a.days);
	});
	const overdue = $derived(receivables.filter((r) => r.days > 0));
	const lowStock = $derived.by(() => {
		if (!showInv) return [];
		const oh = stockOnHand('products', locMatch('INV'));
		return db
			.all('products')
			.map((pr) => ({ p: pr, qty: oh.get(pr.id) ?? 0, min: pr.minStock ?? 0 }))
			.filter((x) => x.qty <= x.min * 3)
			.sort((a, b) => a.qty / Math.max(1, a.min) - b.qty / Math.max(1, b.min))
			.slice(0, 5);
	});

	const tasks = $derived.by(() => {
		const out: { icon: typeof Clock; tone: string; text: string; sub: string; href?: string }[] = [];
		for (const t of TX.filter((x) => auth.can(x.path, 'post'))) {
			const drafts = db.all<Doc>(t.def.table).filter((d) => d.status === 'draft');
			if (drafts.length) out.push({ icon: Clock, tone: 'amber', text: `${drafts.length} ${t.label} menunggu ${(t.def.postLabel ?? 'posting').toLowerCase()}`, sub: `Terakhir ${fdate(drafts.map((d) => d.date).sort().at(-1))}`, href: drafts.length === 1 ? `${t.path}?id=${drafts[0].id}` : t.path });
		}
		const rcv = LEAVES.find((l) => l.page.kind === 'transaction' && l.page.table === 'store_receipts');
		if (rcv && auth.can(rcv.path)) {
			const used = new Set(db.all<Doc>('store_receipts').filter((d) => d.status !== 'void').map((d) => d.sourceId));
			const transit = db.all<Doc>('inv_store_shipment').filter((d) => d.status === 'posted' && !used.has(d.id));
			if (transit.length) out.push({ icon: Truck, tone: 'blue', text: `${transit.length} kiriman ke toko belum diterima`, sub: transit.map((d) => db.name('stores', d.storeId).replace(/^Senja /, '')).join(', '), href: rcv.path });
		}
		if (overdue.length) out.push({ icon: CalendarClock, tone: 'rose', text: `${overdue.length} tagihan lewat jatuh tempo`, sub: `Total ${money(overdue.reduce((t, r) => t + r.left, 0))}`, href: arLeaf?.path });
		const crit = lowStock.filter((x) => x.qty <= x.min);
		if (crit.length) out.push({ icon: AlertTriangle, tone: 'rose', text: `${crit.length} produk di bawah stok minimum`, sub: crit.map((x) => x.p.name).slice(0, 2).join(', '), href: stockLeaf?.path });
		const lastMonth = addDays(monthStart(T), -1).slice(0, 7);
		const late = LEAVES.filter((x) => x.page.kind === 'custom' && x.page.component === 'closing' && auth.can(x.path)).filter((l) => {
			const c = lastClosing((l.page as { props?: Record<string, any> }).props?.scope);
			return !c || c.period < lastMonth;
		});
		if (late.length)
			out.push({ icon: Lock, tone: 'stone', text: `Closing stok ${new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(dt(lastMonth + '-01'))} belum dilakukan`, sub: late.map((l) => l.module.label).join(', '), href: late[0].path });
		return out;
	});
	let allTasks = $state(false);
	const toneCls: Record<string, string> = {
		amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
		blue: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
		rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
		stone: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
	};

	const shortcuts = $derived(LEAVES.filter((l) => l.page.kind === 'transaction' && auth.can(l.path, 'create')).map((l) => ({ label: l.label, icon: l.icon, href: `${l.path}?id=new`, section: l.module.label })));
	const modules = $derived(visibleTree(MENU, (pth) => auth.can(pth)));
	const analysis = $derived(leafOf('sales-analysis'));
	const filtered = $derived(!!channel || !!category);
	const periodText = $derived(`${fdate(per.from)} – ${fdate(per.to)}`);
</script>

<svelte:head><title>Dashboard · ruangSenja</title></svelte:head>

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

{#snippet kpi(icon: typeof Clock, color: string, label: string, value: string, full: string, delta: number | null, spark: number[], foot?: string, upGood = true)}
	{@const Icon = icon}
	<div class="card relative flex min-w-0 flex-col overflow-hidden p-3.5 sm:p-4">
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
	</div>
{/snippet}

<!-- kepala -->
<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
	<div>
		<p class="text-sm text-stone-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
		<h1 class="text-2xl font-medium">{greet}, {auth.user?.name.split(' ')[0]} 👋</h1>
	</div>
	<div class="flex items-center gap-2">
		<span class="mr-1 hidden items-center gap-1.5 text-xs text-stone-400 sm:inline-flex"><RotateCcw class="size-3.5" /> Diperbarui {updatedAt}</span>
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

{#if showSales}
	<!-- filter: satu baris, mengatur semua angka penjualan di bawahnya -->
	<div class="card mb-4 flex flex-wrap items-center gap-2 p-2 sm:gap-3">
		<div class="-mx-0.5 max-w-full overflow-x-auto px-0.5">{@render seg(RANGES, range, (k) => (range = k), 'Periode')}</div>
		<div class="w-[calc(50%-0.25rem)] sm:w-48">
			<Select bind:value={channel} options={[{ value: '', label: 'Semua channel' }, ...channels.map((c) => ({ value: c.id, label: c.name, hint: c.city }))]} label="Channel" compact />
		</div>
		<div class="w-[calc(50%-0.25rem)] sm:w-44">
			<Select bind:value={category} options={[{ value: '', label: 'Semua kategori' }, ...categories]} label="Kategori" compact />
		</div>
		{#if filtered}
			<button class="btn btn-ghost btn-sm" onclick={() => ((channel = ''), (category = ''))}><RotateCcw class="size-3.5" /> Reset</button>
		{/if}
		<span class="ml-auto hidden text-xs text-stone-400 lg:inline">{periodText} · dibanding {per.prevLabel.toLowerCase()}</span>
	</div>

	<!-- KPI -->
	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
		{@render kpi(BadgeDollarSign, 'var(--viz-1)', 'Total Penjualan', short(s.sales), money(s.sales), pctChange(s.sales, p.sales), series.map((x) => x.sales))}
		{@render kpi(ReceiptText, 'var(--viz-3)', 'Jumlah Transaksi', num(s.trx), `${num(s.qty)} pcs terjual`, pctChange(s.trx, p.trx), series.map((x) => x.trx))}
		{@render kpi(ShoppingBag, 'var(--viz-5)', 'Rata-rata per Transaksi', short(s.avg), money(s.avg), pctChange(s.avg, p.avg), series.map((x) => x.avg))}
		{@render kpi(CircleDollarSign, 'var(--viz-2)', 'Laba Kotor', short(s.profit), money(s.profit), pctChange(s.profit, p.profit), series.map((x) => x.profit), `margin ${num(Math.round(s.margin * 10) / 10)}%`)}
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
					<h2 class="font-medium">Tren {METRICS.find((m) => m.key === metric)?.label}</h2>
					<div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
						<span class="inline-flex items-center gap-1.5"><span class="h-0.5 w-4 rounded-full" style="background:var(--viz-1)"></span>{per.size === 7 ? 'Mingguan, ' : 'Harian, '}periode ini</span>
						<span class="inline-flex items-center gap-1.5"><span class="h-0.5 w-4 rounded-full" style="background:var(--viz-muted)"></span>{per.prevLabel}</span>
					</div>
				</div>
				{@render seg(METRICS, metric, (k) => (metric = k), 'Ukuran tren')}
			</div>
			<TrendChart points={trend} fmt={metricFmt} prevLabel={per.prevLabel} ariaLabel="Tren {METRICS.find((m) => m.key === metric)?.label} {periodText}" />
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
					<h2 class="font-medium">Kinerja Toko & Channel</h2>
					<p class="text-xs text-stone-500">Klik baris untuk memfilter dashboard</p>
				</div>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
							<th class="py-2 pr-2 pl-4 font-semibold sm:pl-5">Channel</th>
							<th class="px-2 py-2 text-right font-semibold">Penjualan</th>
							<th class="hidden px-2 py-2 text-right font-semibold sm:table-cell">Trx</th>
							<th class="hidden px-2 py-2 text-right font-semibold md:table-cell">Rata-rata</th>
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
								<td class="hidden px-2 py-2.5 text-right tabular-nums md:table-cell">{short(r.st.avg)}</td>
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
			<p class="mb-3 text-xs text-stone-500">Rata-rata penjualan per hari, per channel</p>
			<Heatmap rows={heat.rows} cols={DOW} values={heat.values} fmt={money} cellFmt={(v) => (v >= 1e6 ? (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt' : Math.round(v / 1e3) + 'rb')} />
		</section>
	</div>

	<div class="mb-4 grid gap-4 xl:grid-cols-12">
		<!-- produk terlaris -->
		<section class="card min-w-0 p-4 sm:p-5 xl:col-span-7">
			<div class="mb-3 flex items-start justify-between gap-3">
				<h2 class="font-medium">Produk Terlaris</h2>
				{@render seg([{ key: 'amount', label: 'Nilai' }, { key: 'qty', label: 'Qty' }], prodSort, (k) => (prodSort = k), 'Urutkan produk')}
			</div>
			<ol class="space-y-1">
				{#each topProducts as r, i (r.p?.id)}
					<li class="flex items-center gap-3 rounded-xl px-1 py-1.5">
						<span class="grid size-7 shrink-0 place-items-center rounded-lg text-xs font-semibold {i === 0 ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}">{i + 1}</span>
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-3">
								<span class="truncate text-sm font-medium">{r.p?.name}</span>
								<span class="shrink-0 text-sm font-medium tabular-nums">{prodSort === 'qty' ? num(r.qty) + ' pcs' : short(r.amount)}</span>
							</div>
							<div class="mt-1 flex items-center gap-2">
								<span class="inline-flex w-20 shrink-0 items-center gap-1.5 truncate text-[11px] text-stone-400"><span class="size-2 rounded-[2px]" style="background:{catColor(r.p?.category)}"></span>{r.p?.category}</span>
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

		<!-- komposisi -->
		<section class="card min-w-0 p-4 sm:p-5 xl:col-span-5">
			<h2 class="font-medium">Segmentasi Pelanggan</h2>
			<p class="mb-3 text-xs text-stone-500">{num(segBuyers)} pelanggan terdaftar bertransaksi</p>
			<StackBar items={segSlices} fmt={money} />
			<div class="my-5 border-t border-stone-100 dark:border-stone-800"></div>
			<h2 class="font-medium">Metode Pembayaran</h2>
			<p class="mb-3 text-xs text-stone-500">Porsi nilai penjualan</p>
			<StackBar items={paySlices} fmt={money} />
		</section>
	</div>
{/if}

<!-- operasional -->
{#if finance || showInv}
	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		{#if finance}
			{@render mini(Landmark, 'Saldo Kas & Bank', finance.cash, `${db.all('cashbanks').length} akun`)}
			{@render mini(Wallet, 'Piutang Usaha', finance.ar, overdue.length ? `${overdue.length} lewat jatuh tempo` : 'Semua belum jatuh tempo')}
			{@render mini(ReceiptText, 'Hutang Usaha', finance.ap, 'Ke supplier')}
		{/if}
		{#if showInv}{@render mini(Boxes, 'Nilai Persediaan', stockValue, 'Gudang + toko (harga beli)')}{/if}
	</div>
{/if}
{#snippet mini(icon: typeof Clock, label: string, value: number, sub: string)}
	{@const Icon = icon}
	<div class="card flex items-center gap-3 p-4">
		<span class="hidden size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500 sm:grid dark:bg-stone-800 dark:text-stone-300"><Icon class="size-5" /></span>
		<div class="min-w-0">
			<p class="truncate text-xs text-stone-500">{label}</p>
			<p class="truncate text-lg font-semibold tracking-tight" title={money(value)}>{short(value)}</p>
			<p class="truncate text-[11px] text-stone-400">{sub}</p>
		</div>
	</div>
{/snippet}

<div class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
	<!-- tugas & notifikasi -->
	<section class="card min-w-0 p-4 sm:p-5">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="font-medium">Tugas & Notifikasi</h2>
			{#if tasks.length}<span class="badge bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">{tasks.length}</span>{/if}
		</div>
		<ul class="space-y-1">
			{#each allTasks ? tasks : tasks.slice(0, 6) as t, i (i)}
				{@const Icon = t.icon}
				<li>
					<svelte:element this={t.href ? 'a' : 'div'} href={t.href} class="flex items-center gap-3 rounded-xl p-2 {t.href ? 'transition hover:bg-stone-50 dark:hover:bg-stone-800/50' : ''}">
						<span class="grid size-9 shrink-0 place-items-center rounded-xl {toneCls[t.tone]}"><Icon class="size-4" /></span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-medium">{t.text}</span>
							<span class="block truncate text-xs text-stone-500">{t.sub}</span>
						</span>
						{#if t.href}<ArrowRight class="size-4 shrink-0 text-stone-300" />{/if}
					</svelte:element>
				</li>
			{:else}
				<li class="py-8 text-center text-sm text-stone-400">Tidak ada tugas tertunda 🎉</li>
			{/each}
		</ul>
		{#if tasks.length > 6}
			<button class="btn btn-ghost btn-sm mt-2 w-full" onclick={() => (allTasks = !allTasks)}>{allTasks ? 'Tampilkan lebih sedikit' : `Lihat ${tasks.length - 6} lainnya`}</button>
		{/if}
	</section>

	{#if showFin}
		<section class="card min-w-0 p-4 sm:p-5">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="font-medium">Piutang Belum Lunas</h2>
				{#if arLeaf}<a href={arLeaf.path} class="text-sm text-brand-600 hover:underline">Kartu piutang →</a>{/if}
			</div>
			<ul class="divide-y divide-stone-100 dark:divide-stone-800">
				{#each receivables.slice(0, 5) as r (r.docId)}
					<li class="flex items-center gap-3 py-2.5">
						<div class="min-w-0 flex-1">
							<a href="{r.path}?id={r.docId}" class="block truncate text-sm font-medium hover:underline">{r.name}</a>
							<span class="block truncate text-xs text-stone-400">{r.no} · tempo {fdate(r.due)}</span>
						</div>
						<div class="shrink-0 text-right">
							<p class="text-sm font-medium tabular-nums" title={money(r.left)}>{short(r.left)}</p>
							{#if r.days > 0}
								<span class="badge bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"><AlertTriangle class="size-3" /> lewat {r.days} hari</span>
							{:else}
								<span class="badge bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"><Clock class="size-3" /> {r.days === 0 ? 'hari ini' : `${-r.days} hari lagi`}</span>
							{/if}
						</div>
					</li>
				{:else}
					<li class="py-8 text-center text-sm text-stone-400">Semua piutang lunas</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if showInv}
		<section class="card min-w-0 p-4 sm:p-5">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="font-medium">Stok Gudang Menipis</h2>
				{#if stockLeaf}<a href={stockLeaf.path} class="text-sm text-brand-600 hover:underline">Kartu stok →</a>{/if}
			</div>
			<ul class="space-y-3">
				{#each lowStock as x (x.p.id)}
					{@const crit = x.qty <= x.min}
					<li>
						<a href={stockLeaf ? `${stockLeaf.path}?item=${x.p.id}` : undefined} class="block rounded-lg hover:opacity-80">
							<div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
								<span class="truncate">{x.p.name}</span>
								<span class="inline-flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums {crit ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}">
									{#if crit}<AlertTriangle class="size-3" />{:else}<PackageSearch class="size-3" />{/if}
									{num(x.qty)} / min {num(x.min)}
								</span>
							</div>
							<div class="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800" {@attach tooltip(crit ? 'Di bawah stok minimum' : 'Mendekati stok minimum (≤ 3× minimum)')}>
								<div class="h-1.5 rounded-full {crit ? 'bg-[#d03b3b]' : 'bg-[#fab219]'}" style="width:{Math.max(3, Math.min(100, (x.qty / Math.max(1, x.min * 3)) * 100))}%"></div>
							</div>
						</a>
					</li>
				{:else}
					<li class="py-8 text-center text-sm text-stone-400">Stok gudang aman</li>
				{/each}
			</ul>
		</section>
	{/if}

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
