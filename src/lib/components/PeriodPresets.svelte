<script lang="ts">
	/** Tombol pilihan periode cepat untuk filter tanggal (Hari ini, 7 hari, Bulan ini, …). */
	import { CalendarRange } from '@lucide/svelte';
	import { addDays, iso, monthStart, today } from '#lib/erp/format.ts';
	import { tooltip } from '#lib/ui/tooltip.ts';
	import Menu, { type MenuItem } from './Menu.svelte';

	let { from = $bindable(), to = $bindable() }: { from: string; to: string } = $props();

	function presets(): [string, string, string][] {
		const t = today();
		const d = new Date();
		const lastMonthEnd = iso(new Date(d.getFullYear(), d.getMonth(), 0));
		return [
			['Hari ini', t, t],
			['Kemarin', addDays(t, -1), addDays(t, -1)],
			['7 hari terakhir', addDays(t, -6), t],
			['30 hari terakhir', addDays(t, -29), t],
			['Bulan ini', monthStart(t), t],
			['Bulan lalu', monthStart(lastMonthEnd), lastMonthEnd],
			['Tahun ini', `${d.getFullYear()}-01-01`, t]
		];
	}
	const items = $derived<MenuItem[]>(
		presets().map(([label, f, t]) => ({ label, kbd: from === f && to === t ? '✓' : undefined, onclick: () => ((from = f), (to = t)) }))
	);
</script>

<Menu {items} placement="bottom-end">
	{#snippet trigger(props)}
		<button {...props} type="button" class="btn btn-secondary btn-icon size-10 shrink-0 rounded-xl sm:size-9 aria-expanded:bg-stone-100 dark:aria-expanded:bg-stone-800" aria-label="Periode cepat" {@attach tooltip()}>
			<CalendarRange class="size-4" />
		</button>
	{/snippet}
</Menu>
