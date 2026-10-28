<script lang="ts">
	/**
	 * Pemilih rentang tanggal: satu tombol yang membuka kalender (2 bulan di desktop, 1 bulan di HP) + periode cepat.
	 * Klik tanggal awal lalu tanggal akhir; periode cepat langsung berlaku. Keyboard: panah, PgUp/PgDn, Enter.
	 * Nilai `from` & `to` selalu "yyyy-mm-dd" (from ≤ to).
	 */
	import { CalendarRange, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { addDays, iso, monthStart, today } from '#lib/util/format.ts';
	import { backClose } from '#lib/dom/backClose.svelte.ts';
	import { float, uidEl } from '#lib/dom/floating.ts';
	import { tooltip } from '#lib/dom/tooltip.ts';

	let {
		from = $bindable(),
		to = $bindable(),
		min,
		max = today(),
		maxDays,
		ariaLabel = 'Periode'
	}: {
		from: string;
		to: string;
		min?: string;
		max?: string;
		/** batas panjang rentang (hari); periode cepat yang lebih panjang disembunyikan, pilihan manual dipotong */
		maxDays?: number;
		ariaLabel?: string;
	} = $props();

	const two = new MediaQuery('(min-width: 640px)');
	const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
	const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
	const dm = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
	const dmy = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	const dd = (s: string) => new Date(s + 'T00:00:00');
	const parts = (s: string) => s.split('-').map(Number) as [number, number, number];
	const span = (a: string, b: string) => Math.round((+dd(b) - +dd(a)) / 864e5) + 1;
	const allowed = (s: string) => (!min || s >= min) && (!max || s <= max);

	const T = today();
	const presets = $derived.by(() => {
		const d = new Date();
		const lastMonthEnd = iso(new Date(d.getFullYear(), d.getMonth(), 0));
		const all: [string, string, string][] = [
			['Hari ini', T, T],
			['Kemarin', addDays(T, -1), addDays(T, -1)],
			['7 hari terakhir', addDays(T, -6), T],
			['30 hari terakhir', addDays(T, -29), T],
			['90 hari terakhir', addDays(T, -89), T],
			['Bulan ini', monthStart(T), T],
			['Bulan lalu', monthStart(lastMonthEnd), lastMonthEnd]
		];
		return all.filter(([, f, t]) => allowed(f) && allowed(t) && (!maxDays || span(f, t) <= maxDays));
	});
	const active = $derived(presets.find(([, f, t]) => f === from && t === to)?.[0]);
	const label = $derived(from === to ? dmy.format(dd(from)) : from.slice(0, 4) === to.slice(0, 4) ? `${dm.format(dd(from))} – ${dmy.format(dd(to))}` : `${dmy.format(dd(from))} – ${dmy.format(dd(to))}`);

	const popId = uidEl('range');
	let btn = $state<HTMLButtonElement>();
	let pop = $state<HTMLDivElement>();
	let open = $state(false);
	let stop: (() => void) | null = null;
	backClose(() => open, () => pop?.hidePopover());

	/** tanggal awal yang sudah diklik, menunggu tanggal akhir */
	let anchor = $state('');
	let hover = $state('');
	let cursor = $state(T);
	/** bulan pertama yang tampil (yyyy-mm-01) */
	let vm = $state(monthStart(T));
	const shiftMonth = (s: string, n: number) => {
		const [y, m] = parts(s);
		return iso(new Date(y, m - 1 + n, 1));
	};
	const months = $derived((two.current ? [vm, shiftMonth(vm, 1)] : [vm]).map((m) => ({ m, title: `${MONTHS[parts(m)[1] - 1]} ${parts(m)[0]}`, cells: cells(m) })));
	/** sel hari satu bulan, mulai Senin (kosong di depan agar kolom sejajar) */
	function cells(m: string) {
		const [y, mo] = parts(m);
		const lead = (new Date(y, mo - 1, 1).getDay() + 6) % 7;
		const n = new Date(y, mo, 0).getDate();
		return [...Array<string>(lead).fill(''), ...Array.from({ length: n }, (_, i) => iso(new Date(y, mo - 1, i + 1)))];
	}

	/** rentang yang sedang disorot: pilihan berjalan (awal → hover) atau nilai terpasang */
	const sel = $derived.by(() => {
		if (anchor) {
			const e = hover || anchor;
			return e < anchor ? { a: e, b: anchor } : { a: anchor, b: e };
		}
		return { a: from, b: to };
	});
	const picking = $derived(!!anchor);

	function apply(f: string, t: string) {
		from = f;
		to = t;
		pop?.hidePopover();
	}
	function pick(d: string) {
		if (!allowed(d)) return;
		if (!anchor) {
			anchor = d;
			hover = '';
			return;
		}
		let [a, b] = d < anchor ? [d, anchor] : [anchor, d];
		// terlalu panjang: tanggal yang diklik kedua dipotong, tanggal awal tetap
		if (maxDays && span(a, b) > maxDays) [a, b] = d < anchor ? [addDays(anchor, -(maxDays - 1)), anchor] : [anchor, addDays(anchor, maxDays - 1)];
		if (max && b > max) b = max;
		anchor = '';
		apply(a, b);
	}

	function onbeforetoggle(e: ToggleEvent) {
		if (e.newState === 'open') {
			anchor = '';
			hover = '';
			cursor = to;
			vm = two.current ? shiftMonth(monthStart(to), -1) : monthStart(to);
			stop = float(btn!, pop!, { placement: 'bottom-end', limitHeight: false });
		} else (stop?.(), (stop = null));
	}
	function ontoggle(e: ToggleEvent) {
		open = e.newState === 'open';
		if (open) focusCursor();
		else anchor = '';
	}
	async function focusCursor() {
		await tick();
		pop?.querySelector<HTMLButtonElement>(`[data-d="${cursor}"]`)?.focus({ preventScroll: true });
	}
	/** panah/PgUp/PgDn: pindahkan sorotan, kalender ikut menggeser bulan bila perlu */
	function go(next: string) {
		cursor = next;
		const first = vm;
		const last = two.current ? shiftMonth(vm, 1) : vm;
		const cm = monthStart(next);
		if (cm < first) vm = cm;
		else if (cm > last) vm = two.current ? shiftMonth(cm, -1) : cm;
		if (anchor) hover = next;
		focusCursor();
	}
	function onGridKey(e: KeyboardEvent) {
		const dow = (dd(cursor).getDay() + 6) % 7;
		const month = (n: number) => {
			const [y, m, d] = parts(cursor);
			return iso(new Date(y, m - 1 + n, Math.min(d, new Date(y, m + n, 0).getDate())));
		};
		const moves: Record<string, () => void> = {
			ArrowLeft: () => go(addDays(cursor, -1)),
			ArrowRight: () => go(addDays(cursor, 1)),
			ArrowUp: () => go(addDays(cursor, -7)),
			ArrowDown: () => go(addDays(cursor, 7)),
			Home: () => go(addDays(cursor, -dow)),
			End: () => go(addDays(cursor, 6 - dow)),
			PageUp: () => go(month(e.shiftKey ? -12 : -1)),
			PageDown: () => go(month(e.shiftKey ? 12 : 1)),
			Enter: () => pick(cursor),
			' ': () => pick(cursor)
		};
		const fn = moves[e.key];
		if (!fn) return;
		e.preventDefault();
		fn();
	}
</script>

<button
	bind:this={btn}
	type="button"
	popovertarget={popId}
	class="btn btn-secondary h-10 max-w-full justify-start gap-2 rounded-xl px-3 sm:h-9 aria-expanded:bg-stone-100 dark:aria-expanded:bg-stone-800"
	aria-label="{ariaLabel}: {label}"
	aria-haspopup="dialog"
	aria-expanded={open}
>
	<CalendarRange class="size-4 shrink-0 text-stone-500" />
	{#if active}<span class="font-medium">{active}</span><span class="hidden truncate text-stone-400 md:inline">{label}</span>{:else}<span class="truncate font-medium">{label}</span>{/if}
</button>

<div
	bind:this={pop}
	id={popId}
	popover="auto"
	role="dialog"
	aria-label="Pilih periode"
	{onbeforetoggle}
	{ontoggle}
	class="pop z-[90] w-[min(calc(100vw-1rem),21rem)] rounded-2xl border border-stone-200/80 bg-white p-0 text-stone-900 shadow-2xl shadow-stone-900/10 sm:w-auto dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
>
	<div class="flex flex-col sm:flex-row">
		<!-- periode cepat -->
		<div class="flex gap-1 overflow-x-auto border-b border-stone-100 p-2 sm:w-44 sm:shrink-0 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:p-3 dark:border-stone-800">
			{#each presets as [name, f, t] (name)}
				<button
					type="button"
					class="shrink-0 rounded-lg px-3 py-1.5 text-left text-sm whitespace-nowrap transition {active === name ? 'bg-stone-900 font-medium text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'}"
					onclick={() => apply(f, t)}>{name}</button
				>
			{/each}
		</div>

		<div class="min-w-0 p-3">
			<div class="flex items-start gap-1">
				<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label="Bulan sebelumnya" onclick={() => (vm = shiftMonth(vm, -1))} {@attach tooltip(undefined, { kbd: 'PgUp' })}><ChevronLeft class="size-4" /></button>
				<div class="flex flex-1 justify-around gap-6 sm:gap-8">
					{#each months as mo, i (mo.m)}
						<div class="w-[17.5rem] sm:w-56" role="group" aria-label={mo.title}>
							<p class="mb-1 text-center text-sm font-medium" aria-live="polite">{mo.title}</p>
							<div class="grid grid-cols-7 text-center text-[11px] font-medium text-stone-400">
								{#each DAYS as d (d)}<span class="py-1">{d}</span>{/each}
							</div>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div role="grid" tabindex="-1" class="grid grid-cols-7 gap-y-0.5" onkeydown={onGridKey} onmouseleave={() => (hover = '')}>
								{#each mo.cells as d, k (d || `${mo.m}-${k}`)}
									{#if !d}
										<span></span>
									{:else}
										{@const inRange = d >= sel.a && d <= sel.b}
										{@const edge = d === sel.a || d === sel.b}
										{@const dis = !allowed(d)}
										<div class="{inRange && !edge ? 'bg-brand-100/80 dark:bg-brand-500/20' : ''} {inRange && d === sel.a && sel.a !== sel.b ? 'rounded-l-lg bg-brand-100/80 dark:bg-brand-500/20' : ''} {inRange && d === sel.b && sel.a !== sel.b ? 'rounded-r-lg bg-brand-100/80 dark:bg-brand-500/20' : ''}">
											<button
												type="button"
												role="gridcell"
												data-d={d}
												tabindex={d === cursor ? 0 : -1}
												aria-selected={inRange}
												aria-current={d === T ? 'date' : undefined}
												disabled={dis}
												onclick={() => pick(d)}
												onmouseenter={() => anchor && (hover = d)}
												class="relative grid aspect-square w-full place-items-center rounded-lg text-sm tabular-nums transition outline-none
													{edge ? 'bg-stone-900 font-medium text-white dark:bg-stone-100 dark:text-stone-900' : 'hover:bg-stone-100 dark:hover:bg-stone-800'}
													{dis ? 'cursor-not-allowed opacity-30' : ''}
													{d === cursor && !edge ? 'ring-2 ring-brand-400' : ''}"
											>
												{parts(d)[2]}
												{#if d === T}<span class="absolute bottom-1 size-1 rounded-full {edge ? 'bg-white dark:bg-stone-900' : 'bg-brand-500'}"></span>{/if}
											</button>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label="Bulan berikutnya" onclick={() => (vm = shiftMonth(vm, 1))} {@attach tooltip(undefined, { kbd: 'PgDn' })}><ChevronRight class="size-4" /></button>
			</div>

			<div class="mt-2 flex items-center justify-between gap-3 border-t border-stone-100 pt-2 text-xs dark:border-stone-800">
				<span class="font-medium tabular-nums">{dmy.format(dd(sel.a))}{sel.a !== sel.b ? ` – ${dmy.format(dd(sel.b))}` : ''}</span>
				<span class="text-stone-400">{picking ? 'Pilih tanggal akhir' : `${span(sel.a, sel.b)} hari`}{maxDays && !picking ? ` · maks ${maxDays}` : ''}</span>
			</div>
		</div>
	</div>
</div>
