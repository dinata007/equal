<script lang="ts">
	/**
	 * Panel filter kolom gaya Excel:
	 * urutkan · hapus filter · filter bersyarat (Teks/Angka/Tanggal, 2 syarat Dan/Atau) ·
	 * daftar nilai bercentang dengan cari & "(Pilih Semua)" — tanggal dikelompokkan Tahun › Bulan › Hari.
	 * Filter baru berlaku setelah OK.
	 */
	import {
		ArrowDown01,
		ArrowDown10,
		ArrowDownAZ,
		ArrowDownZA,
		CalendarArrowDown,
		CalendarArrowUp,
		Check,
		ChevronLeft,
		ChevronRight,
		FunnelX,
		Minus,
		Pin,
		PinOff,
		Search
	} from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { num } from '#lib/erp/format.ts';
	import DateInput from '../DateInput.svelte';
	import NumberInput from '../NumberInput.svelte';
	import Select from '../Select.svelte';
	import type { Cond, FilterType, FilterValue } from '../types';
	import { condOk, OPS, opDef } from './core.ts';

	type Opt = { key: string; label: string; count: number };

	let {
		label,
		type,
		value,
		options,
		sortDir,
		money = false,
		describeCond,
		onsort,
		onapply,
		oncancel,
		freeze,
		onfreeze
	}: {
		/** status freeze: kolom ini batas akhir freeze? berapa kolom di-freeze? */
		freeze?: { last: boolean; count: number };
		/** true = freeze sampai kolom ini, false = unfreeze semua */
		onfreeze?: (on: boolean) => void;
		label: string;
		type: FilterType;
		value?: FilterValue;
		/** nilai unik + jumlah baris (filter kolom lain tetap berlaku) */
		options: () => Opt[];
		/** arah urut kolom ini bila sedang jadi satu-satunya urutan */
		sortDir: 1 | -1 | null;
		money?: boolean;
		describeCond: (f: FilterValue) => string;
		onsort: (dir: 1 | -1) => void;
		onapply: (v: FilterValue | null) => void;
		oncancel: () => void;
	} = $props();

	// panel dibuat ulang tiap dibuka → nilai awal cukup dibaca sekali
	// svelte-ignore state_referenced_locally
	const init = value;
	// svelte-ignore state_referenced_locally
	const opts = options();
	const allKeys = opts.map((o) => o.key);

	/* ---------------- daftar nilai ---------------- */
	const checked = new SvelteSet<string>(
		init?.kind === 'values' ? (init.mode === 'in' ? init.values : allKeys.filter((k) => !init.values.includes(k))) : allKeys
	);
	let q = $state('');
	let touched = $state(false);
	const shown = $derived(q ? opts.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : opts);
	const scope = $derived(shown.map((o) => o.key));
	const nOn = $derived(scope.filter((k) => checked.has(k)).length);
	const RENDER = 1000;

	function setKeys(keys: string[], on: boolean) {
		for (const k of keys) on ? checked.add(k) : checked.delete(k);
		touched = true;
	}
	const stateOf = (keys: string[]) => {
		const n = keys.filter((k) => checked.has(k)).length;
		return n === 0 ? 'off' : n === keys.length ? 'on' : 'mixed';
	};

	// tanggal: Tahun › Bulan › Hari
	const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
	const tree = $derived.by(() => {
		if (type !== 'date' || q) return null;
		const years = new Map<string, Map<string, Opt[]>>();
		const blanks: Opt[] = [];
		for (const o of opts) {
			if (!o.key) {
				blanks.push(o);
				continue;
			}
			const y = o.key.slice(0, 4);
			const m = o.key.slice(0, 7);
			if (!years.has(y)) years.set(y, new Map());
			const ms = years.get(y)!;
			ms.set(m, [...(ms.get(m) ?? []), o]);
		}
		return {
			years: [...years].sort(([a], [b]) => b.localeCompare(a)).map(([y, ms]) => ({ y, months: [...ms].sort(([a], [b]) => b.localeCompare(a)).map(([m, days]) => ({ m, days })) })),
			blanks
		};
	});
	const open = new SvelteSet<string>();
	const keysOfYear = (y: { months: { days: Opt[] }[] }) => y.months.flatMap((m) => m.days.map((d) => d.key));

	/* ---------------- filter bersyarat ---------------- */
	// svelte-ignore state_referenced_locally
	const defOp = { text: 'contains', number: 'gt', date: 'between' }[type];
	let view = $state<'main' | 'cond'>('main');
	let a = $state<Cond>(init?.kind === 'cond' ? { ...init.a } : { op: defOp, v: '', v2: '' });
	let b = $state<Cond>(init?.kind === 'cond' && init.b ? { ...init.b } : { op: '', v: '', v2: '' });
	let join = $state<'and' | 'or'>(init?.kind === 'cond' ? init.join : 'and');
	const opOptions = $derived(OPS[type].map((o) => ({ value: o.op, label: o.label })));
	const condName = $derived({ text: 'Filter Teks', number: 'Filter Angka', date: 'Filter Tanggal' }[type]);

	/* ---------------- terapkan ---------------- */
	const canOkMain = $derived(nOn > 0);
	function okMain() {
		if (!canOkMain) return;
		if (!touched && !q && init?.kind === 'cond') return oncancel();
		const inc = (q ? scope : allKeys).filter((k) => checked.has(k));
		if (!q && inc.length === allKeys.length) return onapply(null);
		const exc = allKeys.filter((k) => !checked.has(k));
		onapply(!q && exc.length < inc.length ? { kind: 'values', mode: 'out', values: exc } : { kind: 'values', mode: 'in', values: inc });
	}
	function okCond() {
		if (!condOk(type, a)) return;
		onapply({ kind: 'cond', a: { ...a }, b: condOk(type, b) ? { ...b } : null, join });
	}

	const sortItems = $derived({
		text: [
			{ dir: 1 as const, label: 'Sort A → Z', icon: ArrowDownAZ },
			{ dir: -1 as const, label: 'Sort Z → A', icon: ArrowDownZA }
		],
		number: [
			{ dir: 1 as const, label: 'Sort terkecil → terbesar', icon: ArrowDown01 },
			{ dir: -1 as const, label: 'Sort terbesar → terkecil', icon: ArrowDown10 }
		],
		date: [
			{ dir: 1 as const, label: 'Sort terlama → terbaru', icon: CalendarArrowUp },
			{ dir: -1 as const, label: 'Sort terbaru → terlama', icon: CalendarArrowDown }
		]
	}[type]);
	const item = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-stone-100 focus-visible:bg-stone-100 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-stone-800 dark:focus-visible:bg-stone-800';
</script>

{#snippet box(s: 'on' | 'off' | 'mixed')}
	<span class="grid size-4 shrink-0 place-items-center rounded border transition {s === 'off' ? 'border-stone-300 dark:border-stone-600' : 'border-brand-500 bg-brand-500 text-white'}">
		{#if s === 'on'}<Check class="size-3" strokeWidth={3} />{:else if s === 'mixed'}<Minus class="size-3" strokeWidth={3} />{/if}
	</span>
{/snippet}

{#snippet row(keys: string[], text: string, count: number | null, indent = 0, toggle: string | null = null)}
	{@const s = stateOf(keys)}
	<li class="flex items-center" style="padding-left: {indent * 1.1}rem">
		{#if toggle !== null}
			<button type="button" class="grid size-6 shrink-0 place-items-center rounded text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800" aria-label={open.has(toggle) ? 'Ciutkan' : 'Buka'} aria-expanded={open.has(toggle)} onclick={() => (open.has(toggle) ? open.delete(toggle) : open.add(toggle))}>
				<ChevronRight class="size-3.5 transition-transform {open.has(toggle) ? 'rotate-90' : ''}" />
			</button>
		{:else if type === 'date' && !q}
			<span class="w-6 shrink-0"></span>
		{/if}
		<button type="button" role="checkbox" aria-checked={s === 'mixed' ? 'mixed' : s === 'on'} class="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-sm outline-none hover:bg-stone-100 focus-visible:bg-stone-100 dark:hover:bg-stone-800 dark:focus-visible:bg-stone-800" onclick={() => setKeys(keys, s !== 'on')}>
			{@render box(s)}
			<span class="min-w-0 flex-1 truncate {text === '(Kosong)' ? 'text-stone-400 italic' : ''}">{text}</span>
			{#if count !== null}<span class="text-[11px] text-stone-400 tabular-nums">{num(count)}</span>{/if}
		</button>
	</li>
{/snippet}

{#snippet condRow(c: Cond, optional: boolean)}
	{@const d = opDef(type, c.op)}
	<div class="grid gap-2">
		<Select bind:value={c.op} options={optional ? [{ value: '', label: '(tanpa syarat kedua)' }, ...opOptions] : opOptions} compact label="Syarat" />
		{#if d && d.arity > 0}
			<div class="grid items-center gap-2 {d.arity === 2 ? 'grid-cols-[1fr_auto_1fr]' : ''}">
				{#each (d.arity === 2 ? ['v', 'v2'] : ['v']) as ('v' | 'v2')[] as k, i (k)}
					{#if i === 1}<span class="text-xs text-stone-400">dan</span>{/if}
					{#if type === 'date'}
						<DateInput bind:value={c[k]} compact ariaLabel={k === 'v' ? 'Tanggal' : 'Tanggal akhir'} />
					{:else if type === 'number'}
						<NumberInput bind:value={c[k]} money={money && c.op !== 'top' && c.op !== 'bottom'} compact placeholder={c.op === 'top' || c.op === 'bottom' ? '10' : '0'} />
					{:else}
						<input class="input !h-9 !rounded-lg" bind:value={c[k]} placeholder="Teks…" autocomplete="off" onkeydown={(e) => e.key === 'Enter' && okCond()} />
					{/if}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<div class="flex max-h-[min(80dvh,600px)] min-h-0 w-full flex-1 flex-col">
	{#if view === 'main'}
		<div class="shrink-0 p-1.5">
			{#each sortItems as s (s.dir)}
				<button type="button" class={item} onclick={() => onsort(s.dir)}>
					<s.icon class="size-4 shrink-0 text-stone-500" />
					<span class="flex-1">{s.label}</span>
					{#if sortDir === s.dir}<Check class="size-4 text-brand-600" />{/if}
				</button>
			{/each}
		</div>
		{#if freeze && onfreeze}
			<div class="shrink-0 border-t border-stone-100 p-1.5 dark:border-stone-800">
				<button type="button" class={item} onclick={() => onfreeze(!freeze.last)}>
					{#if freeze.last}<PinOff class="size-4 shrink-0 text-stone-500" />{:else}<Pin class="size-4 shrink-0 text-stone-500" />{/if}
					<span class="flex-1">{freeze.last ? 'Unfreeze kolom' : 'Freeze sampai kolom ini'}</span>
					{#if freeze.count && !freeze.last}<span class="text-[11px] text-stone-400">Freeze: {freeze.count} kolom</span>{/if}
				</button>
			</div>
		{/if}
		<div class="shrink-0 border-t border-stone-100 p-1.5 dark:border-stone-800">
			<button type="button" class={item} disabled={!init} onclick={() => onapply(null)}>
				<FunnelX class="size-4 shrink-0 text-stone-500" />
				<span class="min-w-0 flex-1 truncate">Hapus filter dari “{label}”</span>
			</button>
			<button type="button" class={item} onclick={() => (view = 'cond')}>
				<span class="grid size-4 shrink-0 place-items-center">{#if init?.kind === 'cond'}<Check class="size-4 text-brand-600" />{/if}</span>
				<span class="min-w-0 flex-1">
					<span class="block">{condName}</span>
					{#if init?.kind === 'cond'}<span class="block truncate text-xs text-brand-700 dark:text-brand-300">{describeCond(init)}</span>{/if}
				</span>
				<ChevronRight class="size-4 shrink-0 text-stone-400" />
			</button>
		</div>
		<div class="flex min-h-0 flex-1 flex-col border-t border-stone-100 p-2 dark:border-stone-800">
			<div class="relative shrink-0">
				<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
				<!-- svelte-ignore a11y_autofocus -->
				<input class="input !h-9 !rounded-lg pl-9" type="search" placeholder="Cari nilai…" bind:value={q} autofocus autocomplete="off" onkeydown={(e) => e.key === 'Enter' && okMain()} />
			</div>
			<ul class="mt-1.5 min-h-24 flex-1 overflow-y-auto overscroll-contain rounded-lg border border-stone-100 p-1 sm:max-h-64 dark:border-stone-800" aria-label="Nilai {label}">
				{#if shown.length}
					{@render row(scope, q ? '(Pilih Semua Hasil Cari)' : '(Pilih Semua)', null)}
				{/if}
				{#if tree}
					{#each tree.years as y (y.y)}
						{@render row(keysOfYear(y), y.y, null, 0, y.y)}
						{#if open.has(y.y)}
							{#each y.months as m (m.m)}
								{@render row(m.days.map((d) => d.key), MONTHS[Number(m.m.slice(5)) - 1], null, 1, m.m)}
								{#if open.has(m.m)}
									{#each m.days as d (d.key)}{@render row([d.key], String(Number(d.key.slice(8))), d.count, 2)}{/each}
								{/if}
							{/each}
						{/if}
					{/each}
					{#each tree.blanks as o (o.key)}{@render row([o.key], o.label, o.count)}{/each}
				{:else}
					{#each shown.slice(0, RENDER) as o (o.key)}{@render row([o.key], o.label, o.count)}{/each}
					{#if shown.length > RENDER}<li class="px-2 py-2 text-xs text-stone-400">+{num(shown.length - RENDER)} nilai lagi — ketik untuk mempersempit</li>{/if}
				{/if}
				{#if !shown.length}<li class="px-2 py-6 text-center text-sm text-stone-400">Tidak ada nilai yang cocok</li>{/if}
			</ul>
		</div>
		<div class="flex shrink-0 items-center justify-end gap-2 border-t border-stone-100 px-3 py-2.5 dark:border-stone-800">
			<span class="mr-auto text-[11px] text-stone-400 tabular-nums">{num(nOn)} dari {num(scope.length)} dipilih</span>
			<button type="button" class="btn btn-secondary btn-sm" onclick={oncancel}>Batal</button>
			<button type="button" class="btn btn-primary btn-sm min-w-16" disabled={!canOkMain} onclick={okMain}>OK</button>
		</div>
	{:else}
		<div class="flex shrink-0 items-center gap-1 border-b border-stone-100 p-1.5 dark:border-stone-800">
			<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label="Kembali" onclick={() => (view = 'main')}><ChevronLeft class="size-4" /></button>
			<p class="text-sm font-medium">{condName}</p>
		</div>
		<div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
			<p class="text-xs text-stone-500">Tampilkan baris bila <b class="font-semibold text-stone-700 dark:text-stone-300">{label}</b>:</p>
			{@render condRow(a, false)}
			<div class="flex gap-1 rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800/60" role="radiogroup" aria-label="Gabungan syarat">
				{#each [{ k: 'and', l: 'Dan' }, { k: 'or', l: 'Atau' }] as o (o.k)}
					<button type="button" role="radio" aria-checked={join === o.k} class="flex-1 rounded-md py-1 text-xs font-medium transition {join === o.k ? 'bg-white shadow-sm dark:bg-stone-700' : 'text-stone-500'}" onclick={() => (join = o.k as 'and' | 'or')}>{o.l}</button>
				{/each}
			</div>
			{@render condRow(b, true)}
		</div>
		<div class="flex shrink-0 items-center justify-end gap-2 border-t border-stone-100 px-3 py-2.5 dark:border-stone-800">
			<button type="button" class="btn btn-secondary btn-sm" onclick={oncancel}>Batal</button>
			<button type="button" class="btn btn-primary btn-sm min-w-16" disabled={!condOk(type, a)} onclick={okCond}>OK</button>
		</div>
	{/if}
</div>
