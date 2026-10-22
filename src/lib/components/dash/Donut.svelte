<script lang="ts" module>
	export interface Slice {
		key: string;
		label: string;
		value: number;
		color: string;
	}
</script>

<script lang="ts">
	/**
	 * Komposisi (part-to-whole, ≤ 6 segmen) + legenda berlabel langsung (% & nilai).
	 * Segmen/legenda dapat diklik untuk memfilter; sela 2px warna permukaan antar segmen.
	 */
	let {
		items,
		fmt,
		centerLabel,
		selected = '',
		onselect,
		size = 176
	}: { items: Slice[]; fmt: (v: number) => string; centerLabel: string; selected?: string; onselect?: (key: string) => void; size?: number } = $props();

	let hover = $state<string | null>(null);
	const total = $derived(items.reduce((s, i) => s + i.value, 0));
	const R = $derived(size / 2);
	const r = $derived(R - 22);
	const focusKey = $derived(hover ?? (selected || null));
	const focus = $derived(items.find((i) => i.key === focusKey));

	const arcs = $derived.by(() => {
		let a = -Math.PI / 2;
		const gap = items.filter((i) => i.value > 0).length > 1 ? 2 / R : 0;
		return items.map((it) => {
			const sweep = total ? (it.value / total) * Math.PI * 2 : 0;
			const a0 = a + gap / 2;
			const a1 = a + sweep - gap / 2;
			a += sweep;
			return { it, d: sweep > gap ? sector(a0, a1) : '' };
		});
	});
	function sector(a0: number, a1: number) {
		const p = (rad: number, ang: number) => `${(R + rad * Math.cos(ang)).toFixed(2)},${(R + rad * Math.sin(ang)).toFixed(2)}`;
		const large = a1 - a0 > Math.PI ? 1 : 0;
		// lingkaran penuh (satu segmen) → dua setengah busur
		if (a1 - a0 >= Math.PI * 2 - 1e-6) {
			const m = a0 + Math.PI;
			return `M${p(R, a0)}A${R},${R} 0 1 1 ${p(R, m)}A${R},${R} 0 1 1 ${p(R, a0)}M${p(r, a0)}A${r},${r} 0 1 0 ${p(r, m)}A${r},${r} 0 1 0 ${p(r, a0)}Z`;
		}
		return `M${p(R, a0)}A${R},${R} 0 ${large} 1 ${p(R, a1)}L${p(r, a1)}A${r},${r} 0 ${large} 0 ${p(r, a0)}Z`;
	}
	const pct = (v: number) => (total ? (v / total) * 100 : 0);
	const pctText = (v: number) => pct(v).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%';
	const dim = (key: string) => focusKey !== null && focusKey !== key;
</script>

<div class="flex flex-col items-center gap-5 sm:flex-row xl:flex-col">
	<div class="relative shrink-0" style="width:{size}px;height:{size}px">
		<svg width={size} height={size} role="img" aria-label="Komposisi {centerLabel}: {items.map((i) => `${i.label} ${pctText(i.value)}`).join(', ')}">
			{#if !total}
				<circle cx={R} cy={R} r={(R + r) / 2} fill="none" stroke="var(--viz-grid)" stroke-width={R - r} />
			{/if}
			{#each arcs as { it, d } (it.key)}
				{#if d}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<path
						{d}
						fill={it.color}
						fill-rule="evenodd"
						class="cursor-pointer transition-opacity duration-150"
						opacity={dim(it.key) ? 0.25 : 1}
						onpointerenter={() => (hover = it.key)}
						onpointerleave={() => (hover = null)}
						onclick={() => onselect?.(it.key)}
					/>
				{/if}
			{/each}
		</svg>
		<div class="pointer-events-none absolute inset-0 grid place-content-center text-center">
			<p class="text-[11px] text-stone-500">{focus ? focus.label : centerLabel}</p>
			<p class="text-lg leading-tight font-semibold">{fmt(focus ? focus.value : total)}</p>
			{#if focus}<p class="text-[11px] text-stone-400 tabular-nums">{pctText(focus.value)}</p>{/if}
		</div>
	</div>

	<ul class="w-full min-w-0 flex-1 space-y-0.5">
		{#each items as it (it.key)}
			<li>
				<button
					type="button"
					class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-stone-50 dark:hover:bg-stone-800/50 {selected === it.key
						? 'bg-stone-100 dark:bg-stone-800'
						: ''} {dim(it.key) ? 'opacity-50' : ''}"
					aria-pressed={selected === it.key}
					onpointerenter={() => (hover = it.key)}
					onpointerleave={() => (hover = null)}
					onfocus={() => (hover = it.key)}
					onblur={() => (hover = null)}
					onclick={() => onselect?.(it.key)}
				>
					<span class="size-2.5 shrink-0 rounded-[3px]" style="background:{it.color}"></span>
					<span class="min-w-0 flex-1 truncate">{it.label}</span>
					<span class="text-xs text-stone-400 tabular-nums">{fmt(it.value)}</span>
					<span class="w-12 text-right font-medium tabular-nums">{pctText(it.value)}</span>
				</button>
			</li>
		{/each}
	</ul>
</div>
