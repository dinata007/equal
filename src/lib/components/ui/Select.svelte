<script lang="ts" module>
	export type SelectValue = string | number;
	export interface SelectOption {
		value: SelectValue;
		label: string;
		hint?: string;
		/** teks tambahan untuk pencarian (kode, barcode, …) */
		keywords?: string;
	}
</script>

<script lang="ts">
	/**
	 * Dropdown modern pengganti <select>: Popover API (top layer) + Floating UI,
	 * navigasi keyboard & typeahead, pencarian, bottom sheet di HP, ARIA listbox.
	 */
	import { Check, ChevronDown, Search, X } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { backClose } from '#lib/dom/backClose.svelte.ts';
	import { float, isMobile, uidEl } from '#lib/dom/floating.ts';

	let {
		value = $bindable(),
		options,
		placeholder = 'Pilih…',
		disabled = false,
		clearable = false,
		compact = false,
		searchable,
		id,
		label,
		display,
		limit = 100,
		emptyText = 'Tidak ada pilihan',
		onchange
	}: {
		value?: SelectValue | null;
		options: (SelectOption | string | number)[];
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		compact?: boolean;
		/** default: otomatis bila pilihan > 8 */
		searchable?: boolean;
		id?: string;
		/** judul pada bottom sheet (HP) */
		label?: string;
		/** teks pada tombol untuk pilihan terpilih */
		display?: (o: SelectOption) => string;
		limit?: number;
		emptyText?: string;
		onchange?: (value: SelectValue | null, option?: SelectOption) => void;
	} = $props();

	const popId = uidEl('sel');
	let trigger = $state<HTMLButtonElement>();
	let pop = $state<HTMLDivElement>();
	let listEl = $state<HTMLUListElement>();
	let searchEl = $state<HTMLInputElement>();
	let open = $state(false);
	let sheet = $state(false);
	let query = $state('');
	let active = $state(0);
	let stop: (() => void) | null = null;
	let typed = '';
	let typedAt = 0;
	backClose(() => open, () => pop?.hidePopover());

	// nilai ganda dibuang (yang pertama dipakai): daftar ber-key nilai → key ganda membuat seluruh halaman error
	const opts = $derived.by<SelectOption[]>(() => {
		const seen = new Set<SelectValue>();
		return options
			.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) }))
			.filter((o) => !seen.has(o.value) && (seen.add(o.value), true));
	});
	const canSearch = $derived(searchable ?? opts.length > 8);
	const selected = $derived(opts.find((o) => o.value === value));
	const shown = $derived.by(() => {
		const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
		const list = terms.length ? opts.filter((o) => terms.every((t) => `${o.label} ${o.hint ?? ''} ${o.keywords ?? ''}`.toLowerCase().includes(t))) : opts;
		return list.slice(0, limit);
	});
	const text = $derived(selected ? (display ? display(selected) : selected.label) : '');

	function onbeforetoggle(e: ToggleEvent) {
		if (e.newState === 'open') {
			sheet = isMobile();
			query = '';
			active = Math.max(0, opts.findIndex((o) => o.value === value));
			stop = sheet ? null : float(trigger!, pop!, { matchWidth: true });
			if (sheet) pop!.style.cssText = '';
		} else {
			stop?.();
			stop = null;
		}
	}
	async function ontoggle(e: ToggleEvent) {
		open = e.newState === 'open';
		if (open) {
			await tick();
			(canSearch ? searchEl : listEl)?.focus({ preventScroll: true });
			scrollActive();
		} else if (pop?.contains(document.activeElement) || document.activeElement === document.body) trigger?.focus({ preventScroll: true });
	}

	function choose(o: SelectOption | undefined) {
		value = o ? o.value : null;
		onchange?.(value, o);
		pop?.hidePopover();
	}
	function scrollActive() {
		listEl?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
	}
	function move(to: number) {
		if (!shown.length) return;
		active = Math.max(0, Math.min(shown.length - 1, to));
		scrollActive();
	}
	function onkey(e: KeyboardEvent) {
		const k = e.key;
		if (k === 'ArrowDown') move(active + 1);
		else if (k === 'ArrowUp') move(active - 1);
		else if (k === 'Home' && !canSearch) move(0);
		else if (k === 'End' && !canSearch) move(shown.length - 1);
		else if (k === 'PageDown') move(active + 8);
		else if (k === 'PageUp') move(active - 8);
		else if (k === 'Enter' || (k === ' ' && !canSearch)) shown[active] && choose(shown[active]);
		else if (k === 'Tab') pop?.hidePopover();
		else if (!canSearch && k.length === 1 && !e.ctrlKey && !e.metaKey) {
			// typeahead: ketik huruf untuk lompat
			typed = Date.now() - typedAt > 700 ? k : typed + k;
			typedAt = Date.now();
			const i = shown.findIndex((o) => o.label.toLowerCase().startsWith(typed.toLowerCase()));
			if (i >= 0) move(i);
			return;
		} else return;
		e.preventDefault();
	}
	function onTriggerKey(e: KeyboardEvent) {
		if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) {
			e.preventDefault();
			pop?.showPopover();
		}
	}
</script>

<button
	bind:this={trigger}
	{id}
	type="button"
	{disabled}
	popovertarget={popId}
	aria-haspopup="listbox"
	aria-expanded={open}
	aria-controls={popId}
	onkeydown={onTriggerKey}
	class="input flex items-center gap-2 text-left {compact ? '!h-9 !rounded-lg' : ''} {open ? 'border-brand-400 ring-4 ring-brand-400/20' : ''} {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
>
	<!-- contain-inline-size: teks panjang tidak ikut menentukan lebar minimum tombol (tanpa ini kolom form melebar & muncul scroll samping) -->
	<span class="min-w-0 flex-1 truncate contain-inline-size {text ? '' : 'text-stone-400'}">{text || placeholder}</span>
	{#if clearable && selected && !disabled}
		<span
			role="button"
			tabindex="-1"
			aria-label="Kosongkan"
			class="-mr-1 grid size-6 place-items-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800"
			onclick={(e) => (e.stopPropagation(), e.preventDefault(), choose(undefined))}
			onkeydown={() => {}}
		>
			<X class="size-3.5" />
		</span>
	{/if}
	{#if !disabled}<ChevronDown class="size-4 shrink-0 text-stone-400 transition-transform duration-200 {open ? 'rotate-180' : ''}" />{/if}
</button>

<div
	bind:this={pop}
	id={popId}
	popover="auto"
	{onbeforetoggle}
	{ontoggle}
	onkeydown={onkey}
	role="presentation"
	class="pop z-[90] flex flex-col overflow-hidden border border-stone-200/80 bg-white shadow-2xl shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900 {sheet
		? 'pop-sheet pb-safe rounded-t-3xl'
		: 'w-max max-w-[min(28rem,calc(100vw-16px))] rounded-xl'}"
>
	{#if sheet}
		<div class="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-stone-200 dark:bg-stone-700"></div>
		{#if label}<p class="px-5 pt-3 pb-1 text-sm font-medium">{label}</p>{/if}
	{/if}
	{#if canSearch}
		<div class="flex shrink-0 items-center gap-2 border-b border-stone-100 px-3 dark:border-stone-800 {sheet ? 'mx-2 mt-2 rounded-xl border bg-stone-50 dark:bg-stone-800/50' : ''}">
			<Search class="size-4 shrink-0 text-stone-400" />
			<input
				bind:this={searchEl}
				bind:value={query}
				oninput={() => (active = 0)}
				class="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-stone-400 sm:text-sm"
				placeholder="Cari…"
				autocomplete="off"
				role="combobox"
				aria-expanded="true"
				aria-controls="{popId}-list"
				aria-activedescendant={shown[active] ? `${popId}-o${active}` : undefined}
			/>
		</div>
	{/if}
	<ul
		bind:this={listEl}
		id="{popId}-list"
		role="listbox"
		tabindex="-1"
		aria-activedescendant={!canSearch && shown[active] ? `${popId}-o${active}` : undefined}
		class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 outline-none {sheet ? 'px-2 pb-3' : ''}"
	>
		{#each shown as o, i (o.value)}
			{@const sel = o.value === value}
			<!-- keyboard ditangani di level listbox (aria-activedescendant) -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<li
				id="{popId}-o{i}"
				data-i={i}
				role="option"
				aria-selected={sel}
				class="flex cursor-pointer items-center gap-3 rounded-lg px-3 {sheet ? 'py-3' : 'py-2'} {i === active ? 'bg-brand-50 dark:bg-brand-500/10' : ''}"
				onpointermove={() => (active = i)}
				onclick={() => choose(o)}
			>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm {sel ? 'font-medium' : ''}">{o.label}</span>
					{#if o.hint}<span class="block truncate text-xs text-stone-400">{o.hint}</span>{/if}
				</span>
				{#if sel}<Check class="size-4 shrink-0 text-brand-600" />{/if}
			</li>
		{:else}
			<li class="px-3 py-6 text-center text-sm text-stone-400">{query ? 'Tidak ditemukan' : emptyText}</li>
		{/each}
	</ul>
</div>
