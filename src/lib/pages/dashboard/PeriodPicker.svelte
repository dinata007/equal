<script lang="ts">
	/** Periode bulan: tombol bulan sebelum/sesudah + daftar bulan yang ada datanya (terbaru di atas). */
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import Select from '#lib/components/ui/Select.svelte';
	import { tooltip } from '#lib/dom/tooltip.ts';
	import { ymLabel } from './data.ts';

	let { months, value = $bindable() }: { months: string[]; value: string } = $props();
	const i = $derived(months.indexOf(value));
	const options = $derived(months.map((m) => ({ value: m, label: ymLabel(m) })));
</script>

<div class="flex items-center gap-1">
	<button class="btn btn-ghost btn-icon btn-sm" disabled={i < 0 || i >= months.length - 1} onclick={() => (value = months[i + 1])} aria-label="Bulan sebelumnya" {@attach tooltip()}>
		<ChevronLeft class="size-4" />
	</button>
	<div class="w-44">
		<Select bind:value={() => value, (v) => (value = String(v))} {options} label="Periode" compact searchable={false} />
	</div>
	<button class="btn btn-ghost btn-icon btn-sm" disabled={i <= 0} onclick={() => (value = months[i - 1])} aria-label="Bulan berikutnya" {@attach tooltip()}>
		<ChevronRight class="size-4" />
	</button>
</div>
