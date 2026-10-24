<script lang="ts">
	import DateInput from '#lib/components/ui/DateInput.svelte';
	import PeriodPresets from '#lib/components/ui/PeriodPresets.svelte';

	let { from = $bindable(), to = $bindable() }: { from: string; to: string } = $props();
</script>

<!-- satu baris utuh di HP & tablet (Dari | Sampai | preset) agar tanggal tidak terpotong -->
<div class="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2 sm:col-span-2 lg:col-span-1 lg:flex lg:gap-3">
	<div class="min-w-0 lg:w-52">
		<label class="label" for="pf-from">Dari</label>
		<DateInput id="pf-from" bind:value={from} max={to} />
	</div>
	<div class="min-w-0 lg:w-52">
		<label class="label" for="pf-to">Sampai</label>
		<DateInput id="pf-to" bind:value={to} min={from} />
	</div>
	<PeriodPresets bind:from bind:to />
</div>
