<script lang="ts">
	/**
	 * Input tanggal adaptif:
	 * - HP / layar sentuh → pemilih tanggal bawaan perangkat (paling nyaman di genggaman)
	 * - Desktop → ketik cepat + kalender kustom (Popover API + Floating UI, keyboard penuh)
	 * Nilai selalu "yyyy-mm-dd".
	 */
	import { CalendarDays, ChevronLeft, ChevronRight, X } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { addDays, iso, today } from '#lib/erp/format.ts';
	import { float, uidEl } from '#lib/ui/floating.ts';
	import { tooltip } from '#lib/ui/tooltip.ts';

	let {
		value = $bindable(),
		id,
		disabled = false,
		compact = false,
		clearable = false,
		min,
		max,
		ariaLabel,
		onchange
	}: {
		value?: string;
		id?: string;
		disabled?: boolean;
		compact?: boolean;
		clearable?: boolean;
		min?: string;
		max?: string;
		ariaLabel?: string;
		onchange?: (v: string) => void;
	} = $props();

	const native = new MediaQuery('(max-width: 639px), (pointer: coarse)');

	const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
	const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
	const fmt = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
	const pad = (n: number) => String(n).padStart(2, '0');
	const parts = (s: string) => s.split('-').map(Number) as [number, number, number];
	const valid = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(+new Date(s + 'T00:00:00'));
	const allowed = (s: string) => (!min || s >= min) && (!max || s <= max);

	const popId = uidEl('date');
	let wrap = $state<HTMLDivElement>();
	let pop = $state<HTMLDivElement>();
	let gridEl = $state<HTMLDivElement>();
	let open = $state(false);
	let focused = $state(false);
	let draft = $state('');
	let cursor = $state(today()); // tanggal yang disorot di kalender
	let view = $state<'days' | 'months'>('days');
	let stop: (() => void) | null = null;
	let fromInput = false;

	const shown = $derived(valid(value) ? fmt.format(new Date(value + 'T00:00:00')) : '');
	const [cy, cm] = $derived(parts(cursor));
	/** 6 minggu, mulai Senin */
	const weeks = $derived.by(() => {
		const first = new Date(cy, cm - 1, 1);
		const start = addDays(iso(first), -((first.getDay() + 6) % 7));
		return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
	});

	function set(v: string) {
		if (v && !allowed(v)) return;
		value = v;
		onchange?.(v);
	}

	/** Ketik cepat: 19/10/2026 · 19/10 · 19 · t (hari ini) · +7 / -1 (relatif hari ini) */
	function parse(t: string): string | null {
		t = t.trim().toLowerCase();
		if (!t) return '';
		if (t === 't' || t === 'hari ini' || t === 'today') return today();
		if (/^[+-]\d+$/.test(t)) return addDays(today(), Number(t));
		const m = t.match(/^(\d{1,2})(?:[\/\-. ](\d{1,2})(?:[\/\-. ](\d{2,4}))?)?$/);
		if (!m) return null;
		const [ty, tm] = parts(today());
		const d = +m[1];
		const mo = m[2] ? +m[2] : tm;
		let y = m[3] ? +m[3] : ty;
		if (y < 100) y += 2000;
		// tahun yang masih diketik (mis. "202") belum dianggap tanggal
		if (y < 1900 || y > 2100) return null;
		const s = `${y}-${pad(mo)}-${pad(d)}`;
		const dt = new Date(y, mo - 1, d);
		return dt.getMonth() === mo - 1 && dt.getDate() === d ? s : null;
	}
	function commit() {
		const r = parse(draft);
		if (r === null || (r === '' && !clearable)) return; // tidak valid → kembalikan tampilan lama
		if (r !== value) set(r);
	}

	function onfocus() {
		focused = true;
		draft = valid(value) ? `${parts(value!)[2].toString().padStart(2, '0')}/${pad(parts(value!)[1])}/${parts(value!)[0]}` : '';
	}
	function onblur() {
		commit();
		focused = false;
	}
	function onInput(e: Event) {
		draft = (e.currentTarget as HTMLInputElement).value;
		// pratinjau langsung: kalender melompat ke tanggal yang diketik
		const r = parse(draft);
		if (r) cursor = r;
	}
	function openFromInput() {
		if (open || disabled) return;
		fromInput = true;
		pop?.showPopover();
	}
	function onInputKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commit();
			onfocus();
			pop?.hidePopover();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (open) focusCursor();
			else pop?.showPopover();
		} else if (e.key === 'Escape' && open) pop?.hidePopover();
	}

	/* ---------- kalender ---------- */
	function onbeforetoggle(e: ToggleEvent) {
		if (e.newState === 'open') {
			const typed = focused ? parse(draft) : null;
			cursor = typed || (valid(value) ? value! : today());
			view = 'days';
			stop = float(wrap!, pop!, { placement: 'bottom-start', limitHeight: false });
		} else (stop?.(), (stop = null));
	}
	async function ontoggle(e: ToggleEvent) {
		open = e.newState === 'open';
		if (open && !fromInput) focusCursor();
		fromInput = false;
	}
	async function focusCursor() {
		await tick();
		gridEl?.querySelector<HTMLButtonElement>(`[data-d="${cursor}"]`)?.focus({ preventScroll: true });
	}
	function shiftMonth(n: number) {
		const [y, m, d] = parts(cursor);
		const last = new Date(y, m - 1 + n + 1, 0).getDate();
		cursor = iso(new Date(y, m - 1 + n, Math.min(d, last)));
	}
	function pick(d: string) {
		if (!allowed(d)) return;
		set(d);
		pop?.hidePopover();
		wrap?.querySelector('input')?.focus();
	}
	function onGridKey(e: KeyboardEvent) {
		const dow = (new Date(cursor + 'T00:00:00').getDay() + 6) % 7;
		const moves: Record<string, () => void> = {
			ArrowLeft: () => (cursor = addDays(cursor, -1)),
			ArrowRight: () => (cursor = addDays(cursor, 1)),
			ArrowUp: () => (cursor = addDays(cursor, -7)),
			ArrowDown: () => (cursor = addDays(cursor, 7)),
			Home: () => (cursor = addDays(cursor, -dow)),
			End: () => (cursor = addDays(cursor, 6 - dow)),
			PageUp: () => shiftMonth(e.shiftKey ? -12 : -1),
			PageDown: () => shiftMonth(e.shiftKey ? 12 : 1),
			Enter: () => pick(cursor),
			' ': () => pick(cursor)
		};
		const fn = moves[e.key];
		if (!fn) return;
		e.preventDefault();
		fn();
		if (e.key !== 'Enter' && e.key !== ' ') focusCursor();
	}
	function pickMonth(m: number) {
		const [y, , d] = parts(cursor);
		cursor = iso(new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate())));
		view = 'days';
		focusCursor();
	}
	const T = today();
</script>

{#if native.current}
	<input {id} type="date" class="input {compact ? '!h-9 !rounded-lg' : ''}" bind:value {disabled} {min} {max} aria-label={ariaLabel} onchange={() => onchange?.(value ?? '')} />
{:else}
	<div bind:this={wrap} class="relative">
		<input
			{id}
			class="input pr-16 {compact ? '!h-9 !rounded-lg' : ''} {open ? 'border-brand-400 ring-4 ring-brand-400/20' : ''}"
			value={focused ? draft : shown}
			oninput={onInput}
			onclick={openFromInput}
			{onfocus}
			{onblur}
			onkeydown={onInputKey}
			{disabled}
			placeholder={focused ? 'dd/mm/yyyy' : 'Pilih tanggal'}
			autocomplete="off"
			aria-label={ariaLabel}
			aria-haspopup="dialog"
			aria-expanded={open}
		/>
		<div class="absolute inset-y-0 right-1 flex items-center gap-0.5">
			{#if clearable && value && !disabled}
				<button type="button" class="grid size-7 place-items-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800" aria-label="Kosongkan tanggal" onclick={() => set('')} {@attach tooltip()}>
					<X class="size-3.5" />
				</button>
			{/if}
			<button
				type="button"
				popovertarget={popId}
				{disabled}
				class="grid size-7 place-items-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-40 dark:hover:bg-stone-800 dark:hover:text-stone-200 {open ? 'bg-stone-100 text-stone-700 dark:bg-stone-800' : ''}"
				aria-label="Buka kalender"
				{@attach tooltip(undefined, { kbd: 'Alt ↓' })}
			>
				<CalendarDays class="size-4" />
			</button>
		</div>
	</div>

	<div
		bind:this={pop}
		id={popId}
		popover="auto"
		role="dialog"
		aria-label="Kalender"
		{onbeforetoggle}
		{ontoggle}
		class="pop z-[90] w-72 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-2xl shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900"
	>
		<div class="mb-2 flex items-center gap-1">
			<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label={view === 'days' ? 'Bulan sebelumnya' : 'Tahun sebelumnya'} onclick={() => (shiftMonth(view === 'days' ? -1 : -12), view === 'days' && focusCursor())} {@attach tooltip(undefined, { kbd: 'PgUp' })}>
				<ChevronLeft class="size-4" />
			</button>
			<button type="button" class="flex-1 rounded-lg py-1 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800" onclick={() => (view = view === 'days' ? 'months' : 'days')} aria-live="polite">
				{view === 'days' ? `${MONTHS[cm - 1]} ${cy}` : cy}
			</button>
			<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label={view === 'days' ? 'Bulan berikutnya' : 'Tahun berikutnya'} onclick={() => (shiftMonth(view === 'days' ? 1 : 12), view === 'days' && focusCursor())} {@attach tooltip(undefined, { kbd: 'PgDn' })}>
				<ChevronRight class="size-4" />
			</button>
		</div>

		{#if view === 'days'}
			<div class="grid grid-cols-7 text-center text-[11px] font-medium text-stone-400">
				{#each DAYS as d (d)}<span class="py-1">{d}</span>{/each}
			</div>
			<div bind:this={gridEl} role="grid" tabindex="-1" class="grid grid-cols-7 gap-0.5" onkeydown={onGridKey}>
				{#each weeks.flat() as d (d)}
					{@const [, m, day] = parts(d)}
					{@const sel = d === value}
					{@const out = m !== cm}
					{@const dis = !allowed(d)}
					<button
						type="button"
						role="gridcell"
						data-d={d}
						tabindex={d === cursor ? 0 : -1}
						aria-selected={sel}
						aria-current={d === T ? 'date' : undefined}
						disabled={dis}
						onclick={() => pick(d)}
						class="relative grid aspect-square place-items-center rounded-lg text-sm tabular-nums transition outline-none
							{sel ? 'bg-stone-900 font-medium text-white dark:bg-stone-100 dark:text-stone-900' : 'hover:bg-stone-100 dark:hover:bg-stone-800'}
							{out && !sel ? 'text-stone-300 dark:text-stone-600' : ''}
							{dis ? 'cursor-not-allowed opacity-30' : ''}
							{d === cursor && !sel ? 'ring-2 ring-brand-400' : ''}"
					>
						{day}
						{#if d === T}<span class="absolute bottom-1 size-1 rounded-full {sel ? 'bg-white dark:bg-stone-900' : 'bg-brand-500'}"></span>{/if}
					</button>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-3 gap-1.5 py-1">
				{#each MONTHS as name, i (name)}
					<button type="button" onclick={() => pickMonth(i)} class="rounded-lg py-2.5 text-sm transition {i === cm - 1 ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'hover:bg-stone-100 dark:hover:bg-stone-800'}">
						{name.slice(0, 3)}
					</button>
				{/each}
			</div>
		{/if}

		<div class="mt-2 flex items-center justify-between border-t border-stone-100 pt-2 dark:border-stone-800">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => pick(T)} disabled={!allowed(T)}>Hari ini</button>
			<span class="text-[10px] text-stone-400">← → ↑ ↓ · Enter</span>
		</div>
	</div>
{/if}
