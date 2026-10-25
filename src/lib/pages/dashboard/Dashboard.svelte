<script lang="ts">
	/**
	 * Dashboard 2: pengganti dashboard Stimulsoft lama (dashboard-senja & dashboard-jp), data dari SP yang sama.
	 * Satu menu per perusahaan (hak akses per pengguna); pindah perusahaan lewat pilihan di kepala halaman.
	 * Isi tab: config.ts. Periode & Qty | Nilai berlaku untuk semua tab transaksi dan diingat selama aplikasi terbuka.
	 */
	import { untrack } from 'svelte';
	import { ChartPie, CircleAlert, FlaskConical, RefreshCw } from '@lucide/svelte';
	import { LEAVES, type Leaf } from '#lib/domain/menu.ts';
	import { auth } from '#lib/state/auth.svelte.ts';
	import { toast } from '#lib/state/ui.svelte.ts';
	import { loadSession, saveSession } from '#lib/components/data/grid/core.ts';
	import PageHeader from '#lib/components/data/PageHeader.svelte';
	import { scrollTabs } from '#lib/dom/scrollTabs.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';
	import { date as fdate } from '#lib/util/format.ts';
	import { ApiError } from '#lib/util/api.ts';
	import { DASHBOARDS, type Measure } from './config.ts';
	import { loadSet, nowYm, ymLabel, type Loaded } from './data.ts';
	import FlowTab from './FlowTab.svelte';
	import StockTab from './StockTab.svelte';

	let { leaf, sumber }: { leaf: Leaf; sumber: keyof typeof DASHBOARDS } = $props();

	// svelte-ignore state_referenced_locally
	const def = DASHBOARDS[sumber];
	const companies = $derived(LEAVES.filter((l) => l.page.kind === 'custom' && l.page.component === 'dashboard' && auth.can(l.path)));

	// svelte-ignore state_referenced_locally
	const sKey = `senja:page:${auth.user?.id ?? 'anon'}:${leaf.path}`;
	const saved = loadSession(sKey, { tab: '', measure: 'qty' as Measure, period: '' });
	let tab = $state(saved.tab);
	let measure = $state<Measure>(saved.measure === 'nilai' ? 'nilai' : 'qty');
	let picked = $state(saved.period);
	const cur = $derived(def.tabs.find((t) => t.key === tab) ?? def.tabs[0]);

	/* ---------- data per set (di-cache per sesi oleh loadSet) ---------- */
	let sets = $state.raw<Record<string, Loaded>>({});
	let errors = $state<Record<string, string>>({});
	let busy = $state<Record<string, boolean>>({});
	async function load(set: string, fresh = false) {
		busy = { ...busy, [set]: true };
		try {
			const d = await loadSet(sumber, set, fresh);
			sets = { ...sets, [set]: d };
			errors = { ...errors, [set]: '' };
			if (fresh) toast.success('Data dashboard diperbarui');
		} catch (e) {
			errors = { ...errors, [set]: e instanceof ApiError ? e.message : 'Gagal memuat data dashboard' };
		} finally {
			busy = { ...busy, [set]: false };
		}
	}
	$effect(() => {
		const s = cur.set;
		untrack(() => !sets[s] && !busy[s] && load(s));
	});
	const data = $derived(sets[cur.set]);
	const loading = $derived(!!busy[cur.set]);
	const error = $derived(errors[cur.set]);

	/* ---------- periode: bulan yang ada datanya; bawaan = bulan terbaru s.d. bulan ini ---------- */
	const months = $derived(data && 'ym' in (data.rows[0] ?? {}) ? [...new Set(data.rows.map((r) => r.ym as string))].sort().reverse() : []);
	const period = $derived(months.includes(picked) ? picked : (months.find((m) => m <= nowYm()) ?? months[0] ?? ''));
	$effect(() => saveSession(sKey, { tab, measure, period: picked }));

	const updated = $derived(data?.rows.find((r) => r.updated)?.updated as string | undefined);
	const asOf = $derived(updated ? `Stok per ${fdate(updated)}` : `Stok ${ymLabel(nowYm())}`);
	const at = $derived(data ? new Date(data.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '');
	const demo = $derived(!!data && /demo/i.test(data.db));
</script>

<PageHeader title={leaf.label} subtitle={data ? `Database ${data.db} · data diambil ${at}` : 'Penjualan, pembelian & stok'} icon={ChartPie}>
	{#snippet actions()}
		{#if demo}
			<span class="inline-flex h-8 items-center gap-1.5 rounded-full bg-amber-100 px-3 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" {@attach tooltip('Aplikasi masih memakai database demo, angka belum tentu sama dengan data asli')}>
				<FlaskConical class="size-3.5" /> Data demo
			</span>
		{/if}
		{#if companies.length > 1}
			<nav class="inline-flex rounded-xl bg-stone-100 p-0.5 dark:bg-stone-800" aria-label="Perusahaan">
				{#each companies as c (c.path)}
					{@const on = c.path === leaf.path}
					<a
						href={c.path}
						class="grid h-8 place-items-center rounded-[10px] px-3 text-sm font-medium transition {on ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-950 dark:text-stone-100' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}"
						aria-current={on ? 'page' : undefined}>{DASHBOARDS[(c.page.kind === 'custom' && c.page.props?.sumber) as keyof typeof DASHBOARDS]?.company ?? c.label}</a
					>
				{/each}
			</nav>
		{/if}
		<button class="btn btn-secondary" onclick={() => load(cur.set, true)} disabled={loading} aria-label="Muat ulang data" {@attach tooltip('Ambil data terbaru dari database')}>
			<RefreshCw class="size-4 {loading ? 'animate-spin' : ''}" /><span class="hidden sm:inline">Refresh</span>
		</button>
	{/snippet}
</PageHeader>

<div class="mb-4 rounded-xl bg-stone-100 p-1 dark:bg-stone-800/60">
	<div class="scroll-tabs -m-1 flex gap-1 p-1" role="tablist" aria-label="Isi dashboard" {@attach scrollTabs()}>
		{#each def.tabs as t (t.key)}
			<button
				role="tab"
				aria-selected={t.key === cur.key}
				class="shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition {t.key === cur.key ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}"
				onclick={() => (tab = t.key)}>{t.label}</button
			>
		{/each}
	</div>
</div>

{#if error && !data}
	<div class="card grid place-items-center px-6 py-16 text-center">
		<CircleAlert class="size-10 stroke-[1.5] text-rose-400" />
		<p class="mt-3 font-medium">Data dashboard gagal dimuat</p>
		<p class="mt-1 max-w-md text-sm text-stone-500">{error}</p>
		<button class="btn btn-secondary mt-5" onclick={() => load(cur.set)} disabled={loading}><RefreshCw class="size-4 {loading ? 'animate-spin' : ''}" /> Coba lagi</button>
	</div>
{:else if !data}
	<div class="space-y-4" aria-busy="true" aria-label="Memuat data dashboard">
		<div class="card h-12 animate-pulse"></div>
		<div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
			{#each [0, 1, 2, 3] as i (i)}<div class="card h-28 animate-pulse"></div>{/each}
		</div>
		<div class="card h-80 animate-pulse"></div>
	</div>
{:else if cur.kind === 'flow' && !period}
	<p class="card py-16 text-center text-sm text-stone-400">Belum ada data transaksi dari database {data.db}.</p>
{:else}
	<!-- muat ulang: tampilan lama tetap, sedikit pudar -->
	<div class="transition-opacity {loading ? 'pointer-events-none opacity-60' : ''}">
		{#key cur.key}
			{#if cur.kind === 'flow'}
				<FlowTab tab={cur} rows={data.rows} {months} bind:period={() => period, (v) => (picked = v)} bind:measure />
			{:else}
				<StockTab tab={cur} rows={data.rows} {asOf} />
			{/if}
		{/key}
	</div>
{/if}
